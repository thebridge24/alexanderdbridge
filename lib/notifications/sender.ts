import { createSupabaseAdmin } from "@/lib/supabase/server";
import { importPKCS8, SignJWT } from "jose";

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
  /** When true, also attempt to send an FCM push to the user's registered tokens. */
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
 * and when `push` is true delivers an FCM push to every token registered for that user.
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
      .select("id")
      .single();

    if (insertError) {
      // 23505 is PostgreSQL unique constraint violation (duplicate dedupe_key)
      if (insertError.code === "23505") {
        return { ok: true, skipped: true };
      }
      return { ok: false, error: insertError.message || "Failed to create notification" };
    }

    let pushSent = 0;
    if (push) {
      pushSent = await sendPushToUser(userId, title, body, link);
    }

    return { ok: true, notificationId: inserted.id, pushSent };
  } catch (err: any) {
    console.error("sendNotification failed:", err);
    return { ok: false, error: err.message || "Internal server error" };
  }
}

/**
 * Sends an FCM push to every token registered for a user by POSTing directly
 * to the FCM v1 endpoint using service account credentials.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link?: string,
): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !firebaseProjectId ||
    !firebaseClientEmail ||
    !firebasePrivateKey
  ) {
    console.warn("Push skipped: missing Firebase / Supabase env vars");
    return 0;
  }

  const supabase = createSupabaseAdmin();
  const { data: tokens, error } = await supabase
    .from("push_notification_tokens")
    .select("id, token")
    .eq("user_id", userId);

  if (error || !tokens || tokens.length === 0) return 0;

  const accessToken = await getFirebaseAccessToken(
    firebaseProjectId,
    firebaseClientEmail,
    firebasePrivateKey,
  );
  if (!accessToken) return 0;

  let sent = 0;
  const invalidIds: string[] = [];

  for (const record of tokens) {
    try {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: record.token,
              notification: { title, body },
              data: {
                link: link || "/devotional",
              },
              webpush: {
                fcm_options: { link: link || "/devotional" },
                notification: {
                  title,
                  body,
                  icon: "/devotional.png",
                  badge: "/devotional.png",
                  data: {
                    link: link || "/devotional",
                  },
                },
              },
            },
          }),
        },
      );

      if (res.ok) {
        sent += 1;
      } else {
        const text = await res.text();
        if (text.includes("UNREGISTERED") || text.includes("INVALID_ARGUMENT") || text.includes("NOT_FOUND")) {
          invalidIds.push(record.id);
        } else {
          console.error(`FCM push failed for token ${record.id}:`, text);
        }
      }
    } catch (err) {
      console.error("FCM push fetch failed for token:", err);
    }
  }

  if (invalidIds.length > 0) {
    await supabase
      .from("push_notification_tokens")
      .delete()
      .in("id", invalidIds);
  }

  return sent;
}

// In-memory token cache to avoid re-signing JWT on every message in same runtime lifecycle
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getFirebaseAccessToken(
  projectId: string,
  clientEmail: string,
  privateKey: string,
): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  try {
    const formattedKey = privateKey.replace(/\\n/g, "\n");
    const key = await importPKCS8(formattedKey, "RS256");
    const assertion = await new SignJWT({
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(clientEmail)
      .setSubject(clientEmail)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(key);

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OAuth token fetch failed:", errorText);
      return null;
    }

    const data = await res.json();
    const token = data.access_token || null;
    if (token) {
      cachedAccessToken = {
        token,
        expiresAt: now + (data.expires_in || 3600),
      };
    }
    return token;
  } catch (err) {
    console.error("getFirebaseAccessToken failed:", err);
    return null;
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
  const supabase = createSupabaseAdmin();
  const { data: tokens, error } = await supabase
    .from("push_notification_tokens")
    .select("id, token, user_id");

  if (error || !tokens || tokens.length === 0) return 0;

  const userIds = Array.from(new Set(tokens.map((t) => t.user_id)));
  let total = 0;
  for (const uid of userIds) {
    total += await sendPushToUser(
      uid,
      "Test Notification",
      "Push notifications are working!",
      "/devotional",
    );
  }
  return total;
}