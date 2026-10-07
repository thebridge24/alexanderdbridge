import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  BEAMS_BROADCAST_INTEREST,
  buildWebPush,
  getPusherBeams,
  getPusherChannels,
  userChannelName,
} from "@/lib/pusher/server";

export type NotificationType =
  | "like"
  | "reply"
  | "comment"
  | "reminder"
  | "streak"
  | "milestone"
  | "admin";

export interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  dedupeKey?: string;
  /** When true, also send a Pusher Beams push to every device the user registered. */
  push?: boolean;
}

export interface SendNotificationResult {
  ok: boolean;
  notificationId?: string;
  pushSent?: number;
  skipped?: boolean;
  error?: string;
}

/**
 * Shared helper used by comment/reply/like routes, cron dispatcher, and admin push.
 * It checks user notification preferences, writes an in-app notification row (with dedupe),
 * emits it live over Pusher Channels, and when `push` is true delivers a Pusher Beams push.
 */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  link,
  dedupeKey,
  push = false,
}: SendNotificationOptions): Promise<SendNotificationResult> {
  try {
    const supabase = createSupabaseAdmin();

    // Check user's notification preferences if available
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("reminder_enabled, likes_enabled, replies_enabled, streak_enabled")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefs) {
      if (type === "like" && prefs.likes_enabled === false) {
        return { ok: true, skipped: true };
      }
      if (type === "reply" && prefs.replies_enabled === false) {
        return { ok: true, skipped: true };
      }
      if (type === "reminder" && prefs.reminder_enabled === false) {
        return { ok: true, skipped: true };
      }
      if (type === "streak" && prefs.streak_enabled === false) {
        return { ok: true, skipped: true };
      }
    }

    // Insert into notification_events (with optional dedupe key)
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      type,
      title,
      body,
      link: link || null,
    };

    if (dedupeKey) {
      insertPayload.dedupe_key = dedupeKey;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("notification_events")
      .insert(insertPayload)
      .select("id, type, title, body, link, read, created_at")
      .single();

    if (insertError) {
      // 23505 is PostgreSQL unique constraint violation (duplicate dedupe_key)
      if (insertError.code === "23505") {
        return { ok: true, skipped: true };
      }
      return { ok: false, error: insertError.message || "Failed to create notification" };
    }

    // Live in-app delivery and device push run in parallel; neither failing should fail the call.
    const [, pushSent] = await Promise.all([
      emitInAppNotification(userId, inserted),
      push ? sendPushToUser(userId, title, body, link, type) : Promise.resolve(0),
    ]);

    return { ok: true, notificationId: inserted.id, pushSent };
  } catch (err: any) {
    console.error("sendNotification failed:", err);
    return { ok: false, error: err.message || "Internal server error" };
  }
}

/** Pushes the new notification row to the user's open tabs over Pusher Channels. */
async function emitInAppNotification(userId: string, notification: Record<string, unknown>) {
  const channels = getPusherChannels();
  if (!channels) return;
  try {
    await channels.trigger(userChannelName(userId), "notification", notification);
  } catch (err) {
    console.error("Pusher Channels trigger failed:", err);
  }
}

/**
 * Sends a Pusher Beams push to every device registered for a user.
 * Returns 1 when Beams accepted the publish, 0 otherwise.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link?: string,
  type?: string,
): Promise<number> {
  const beams = getPusherBeams();
  if (!beams) return 0;

  try {
    await beams.publishToUsers([userId], buildWebPush(title, body, link, type));
    return 1;
  } catch (err) {
    console.error(`Pusher Beams publish failed for user ${userId}:`, err);
    return 0;
  }
}

/** Broadcasts a push to every device subscribed to the devotional interest. */
export async function sendPushToAll(
  title: string,
  body: string,
  link?: string,
  type?: string,
): Promise<{ ok: boolean; publishId?: string; error?: string }> {
  const beams = getPusherBeams();
  if (!beams) return { ok: false, error: "Pusher Beams is not configured" };

  try {
    const res = await beams.publishToInterests(
      [BEAMS_BROADCAST_INTEREST],
      buildWebPush(title, body, link, type),
    );
    return { ok: true, publishId: res.publishId };
  } catch (err: any) {
    console.error("Pusher Beams broadcast failed:", err);
    return { ok: false, error: err?.message || "Broadcast failed" };
  }
}

export async function sendTestPushToUser(userId: string): Promise<number> {
  return sendPushToUser(
    userId,
    "Test Notification",
    "Push notifications are working!",
    "/devotional",
  );
}

export async function sendTestPushToAll(): Promise<number> {
  const res = await sendPushToAll(
    "Test Notification",
    "Push notifications are working!",
    "/devotional",
  );
  return res.ok ? 1 : 0;
}
