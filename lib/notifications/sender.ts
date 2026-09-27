import { createSupabaseAdmin } from "@/lib/supabase/server";

type NotificationType = "like" | "reply" | "reminder" | "admin";

interface SendNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  /** When true, also attempt to send an FCM push to the user's registered tokens. */
  push?: boolean;
}

interface SendNotificationResult {
  ok: boolean;
  notificationId?: string;
  pushSent?: number;
  error?: string;
}

/**
 * Shared helper used by comment/reply/like routes and the admin push endpoint.
 * It always writes an in-app notification row. When `push` is true it also
 * delivers an FCM push to every token registered for that user.
 */
export async function sendNotification({
  userId,
  type,
  title,
  body,
  link,
  push = false,
}: SendNotificationOptions): Promise<SendNotificationResult> {
  try {
    const supabase = createSupabaseAdmin();

    const { data: inserted, error: insertError } = await supabase
      .from("notification_events")
      .insert({
        user_id: userId,
        type,
        title,
        body,
        link: link || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return { ok: false, error: insertError?.message || "Failed to create notification" };
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
 * Sends an FCM push to every token registered for a user by invoking the
 * existing `send-daily-devotional` edge function is not suitable for
 * per-user targeted messages, so we POST directly to the FCM v1 endpoint
 * using the same service-account credentials the edge function uses.
 */
async function sendPushToUser(
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
              webpush: {
                fcm_options: { link: link || "/" },
                notification: {
                  title,
                  body,
                  icon: "/devotional.png",
                  badge: "/devotional.png",
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
        if (text.includes("UNREGISTERED") || text.includes("INVALID_ARGUMENT")) {
          invalidIds.push(record.id);
        }
      }
    } catch (err) {
      console.error("FCM push failed for token:", err);
    }
  }

  if (invalidIds.length) {
    await supabase
      .from("push_notification_tokens")
      .delete()
      .in("id", invalidIds);
  }

  return sent;
}

async function getFirebaseAccessToken(
  projectId: string,
  clientEmail: string,
  privateKey: string,
): Promise<string | null> {
  try {
    // Dynamic import so the route still works when jose isn't available at build
    const { importPKCS8, SignJWT } = await import("jose");
    const now = Math.floor(Date.now() / 1000);
    const key = await importPKCS8(privateKey.replace(/\\n/g, "\n"), "RS256");
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
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
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