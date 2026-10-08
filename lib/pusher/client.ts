"use client";

import Pusher from "pusher-js";
import type { Client as BeamsClient } from "@pusher/push-notifications-web";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/** Must match BEAMS_BROADCAST_INTEREST in lib/pusher/server.ts. */
const BEAMS_BROADCAST_INTEREST = "devotional";

export type DevicePushStatus = "enabled" | "blocked" | "error";

async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

let pusherClient: Pusher | null = null;

/** Shared Pusher Channels connection. Returns null when env vars are missing. */
export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") return null;
  if (pusherClient) return pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    console.warn("Pusher Channels disabled: missing NEXT_PUBLIC_PUSHER_KEY / NEXT_PUBLIC_PUSHER_CLUSTER");
    return null;
  }

  pusherClient = new Pusher(key, {
    cluster,
    channelAuthorization: {
      // Custom handler so the Supabase token is read fresh on every (re)subscribe.
      customHandler: async ({ socketId, channelName }, callback) => {
        try {
          const accessToken = await getAccessToken();
          const res = await fetch("/api/pusher/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Bearer ${accessToken ?? ""}`,
            },
            body: new URLSearchParams({ socket_id: socketId, channel_name: channelName }),
          });
          if (!res.ok) throw new Error(`Pusher auth failed with ${res.status}`);
          callback(null, await res.json());
        } catch (err) {
          callback(err as Error, null);
        }
      },
    },
  });
  return pusherClient;
}

/** Disconnects the active Pusher Channels instance if connected. */
export function disconnectPusherClient(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}


let beamsClientPromise: Promise<BeamsClient | null> | null = null;

function getBeamsClient(): Promise<BeamsClient | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
  if (!instanceId) {
    console.warn("Pusher Beams disabled: missing NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID");
    return Promise.resolve(null);
  }
  if (!beamsClientPromise) {
    // The Beams SDK touches window/navigator on import, so load it lazily in the browser.
    beamsClientPromise = import("@pusher/push-notifications-web")
      .then(({ Client }) => new Client({ instanceId }))
      .catch((err) => {
        console.error("Failed to load Pusher Beams:", err);
        beamsClientPromise = null;
        return null;
      });
  }
  return beamsClientPromise;
}

/**
 * Asks for notification permission (if needed), registers this device with Pusher Beams,
 * links it to the signed-in user, and subscribes it to broadcast pushes.
 */
export async function enableDevicePush(userId: string): Promise<DevicePushStatus> {
  if (typeof window === "undefined" || !("Notification" in window)) return "error";

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return "blocked";

  try {
    const beams = await getBeamsClient();
    if (!beams) return "error";

    const accessToken = await getAccessToken();
    if (!accessToken) return "error";

    await beams.start();

    const currentUserId = await beams.getUserId();
    if (currentUserId !== userId) {
      // A different account used this browser before; Beams only allows one user per device.
      if (currentUserId) await beams.clearAllState();

      const { TokenProvider } = await import("@pusher/push-notifications-web");
      await beams.setUserId(
        userId,
        new TokenProvider({
          url: "/api/pusher/beams-auth",
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
    }

    await beams.addDeviceInterest(BEAMS_BROADCAST_INTEREST);
    return "enabled";
  } catch (err) {
    console.error("Failed to enable Pusher Beams push:", err);
    return "error";
  }
}

/** Unlinks this device from the user on sign-out so they stop receiving that account's pushes. */
export async function disableDevicePush(): Promise<void> {
  try {
    const beams = await getBeamsClient();
    if (beams && (await beams.getUserId())) await beams.stop();
  } catch (err) {
    console.error("Failed to stop Pusher Beams:", err);
  }
}
