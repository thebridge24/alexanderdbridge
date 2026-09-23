import { createClient } from "npm:@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "npm:jose@5";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID")!;
const firebaseClientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
const firebasePrivateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n");
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function getFirebaseAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(firebasePrivateKey, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(firebaseClientEmail)
    .setSubject(firebaseClientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) throw new Error(`Firebase auth failed: ${await response.text()}`);
  const data = await response.json();
  return data.access_token;
}

async function sendToToken(accessToken: string, token: string, date: string) {
  return fetch(
    `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: "Your daily devotional is ready",
            body: "Take a few minutes to read, reflect, and pray.",
          },
          webpush: {
            fcm_options: { link: `/devotional/${date}` },
          },
        },
      }),
    },
  );
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: Deno.env.get("DEVOTIONAL_TIMEZONE") || "UTC",
    }).format(new Date());
    const accessToken = await getFirebaseAccessToken();
    const { data: tokens, error } = await supabase
      .from("push_notification_tokens")
      .select("id, token");

    if (error) throw error;

    let sent = 0;
    const invalidTokenIds: string[] = [];
    for (const tokenRecord of tokens ?? []) {
      const response = await sendToToken(accessToken, tokenRecord.token, date);
      if (response.ok) {
        sent += 1;
        continue;
      }

      const responseText = await response.text();
      if (responseText.includes("UNREGISTERED") || responseText.includes("INVALID_ARGUMENT")) {
        invalidTokenIds.push(tokenRecord.id);
      } else {
        console.error("FCM delivery failed:", responseText);
      }
    }

    if (invalidTokenIds.length) {
      await supabase.from("push_notification_tokens").delete().in("id", invalidTokenIds);
    }

    return Response.json({ sent, removed: invalidTokenIds.length, date });
  } catch (error) {
    console.error("Daily devotional push failed:", error);
    return Response.json({ error: "Notification delivery failed" }, { status: 500 });
  }
});
