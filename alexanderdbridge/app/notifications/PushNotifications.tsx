"use client";

import { useEffect, useState } from "react";
import { getToken, isSupported, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function PushNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "enabled" | "blocked" | "error">("idle");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let unsubscribe: (() => void) | undefined;
    isSupported().then((supported) => {
      if (!supported) return;
      const messaging = getFirebaseMessaging();
      if (!messaging) return;
      unsubscribe = onMessage(messaging, (payload) => {
        if (Notification.permission === "granted" && payload.notification) {
          new Notification(payload.notification.title ?? "Daily Devotional", {
            body: payload.notification.body,
            icon: "/devotional.png",
          });
        }
      });
    });

    return () => unsubscribe?.();
  }, [userId]);

  const enableNotifications = async () => {
    if (!userId || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("blocked");
      return;
    }

    try {
      const messaging = getFirebaseMessaging();
      const firebaseConfigReady = Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
      if (!messaging || !firebaseConfigReady) {
        setStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setStatus("error");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase!.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setStatus("error");
        return;
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      setStatus(response.ok ? "enabled" : "error");
    } catch (error) {
      console.error("Unable to enable push notifications:", error);
      setStatus("error");
    }
  };

  if (!userId || status === "enabled") return null;

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="rounded-full border border-neutral-800 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition-colors hover:border-neutral-600 hover:text-white"
      title="Enable daily devotional notifications"
    >
      {status === "blocked" ? "Allow alerts in browser" : "Enable alerts"}
    </button>
  );
}
