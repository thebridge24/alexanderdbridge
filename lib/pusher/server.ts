import Pusher from "pusher";
import PushNotifications from "@pusher/push-notifications-server";

/** Interest every registered device joins, used for "send to everyone" broadcasts. */
export const BEAMS_BROADCAST_INTEREST = "devotional";

/** Private Channels channel that carries live in-app notifications for one user. */
export function userChannelName(userId: string): string {
  return `private-user-${userId}`;
}

let channelsClient: Pusher | null | undefined;
let beamsClient: PushNotifications | null | undefined;

/** Pusher Channels (realtime in-app feed). Returns null when env vars are missing. */
export function hasPusherConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID &&
    (process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY) &&
    process.env.PUSHER_SECRET &&
    (process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER)
  );
}

export function hasBeamsConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID &&
    process.env.PUSHER_BEAMS_SECRET_KEY
  );
}

export function getPusherChannels(): Pusher | null {
  if (channelsClient !== undefined) return channelsClient;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn("Pusher Channels disabled: missing PUSHER_APP_ID / key / secret / cluster");
    channelsClient = null;
    return null;
  }

  channelsClient = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return channelsClient;
}

/** Pusher Beams (device push notifications). Returns null when env vars are missing. */
export function getPusherBeams(): PushNotifications | null {
  if (beamsClient !== undefined) return beamsClient;

  const instanceId = process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID;
  const secretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

  if (!instanceId || !secretKey) {
    console.warn("Pusher Beams disabled: missing NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID / PUSHER_BEAMS_SECRET_KEY");
    beamsClient = null;
    return null;
  }

  beamsClient = new PushNotifications({ instanceId, secretKey });
  return beamsClient;
}


/** Beams requires absolute URLs for deep links and icons. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://personal-library-xi.vercel.app").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Builds the Beams web publish body shared by user and interest publishes. */
export function buildWebPush(
  title: string,
  body: string,
  link?: string,
  type?: string,
  // Only hide when a Channels event also shows an in-app toast; broadcasts have no such fallback
  hideIfSiteHasFocus = true,
) {
  const deepLink = absoluteUrl(link || "/devotional");
  return {
    web: {
      notification: {
        title,
        body,
        icon: absoluteUrl("/devotional.png"),
        deep_link: deepLink,
        hide_notification_if_site_has_focus: hideIfSiteHasFocus,
      },
      data: { link: deepLink, type: type || "admin" },
    },
  };
}
