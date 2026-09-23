"use client";

import { useEffect, useState } from "react";
import { getToken, isSupported } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PushNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const enableNotifications = async () => {
    if (!userId || !("Notification" in window)) return;
    setBusy(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") return;
      if (!(await isSupported())) return;
      const messaging = getFirebaseMessaging();
      if (!messaging) return;
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase?.auth.getSession() || { data: { session: null } };
      if (!token || !data.session?.access_token) return;
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ token }),
      });
      if (response.ok) setEnabled(true);
    } finally {
      setBusy(false);
    }
  };

  if (!userId) return null;
  return (
    <button type="button" onClick={enableNotifications} disabled={busy || enabled} className="size-11 rounded-full border border-white/10 bg-white/5 text-xs text-white disabled:opacity-50" title="Enable notifications">
      {enabled ? "On" : busy ? "..." : "Bell"}
    </button>
  );
}
