"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken, isSupported } from "firebase/messaging";
import { getFirebaseMessaging } from "@/alexanderdbridge/lib/firebase/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type PushStatus = "idle" | "enabled" | "blocked" | "error";

export function usePushRegistration(userId?: string | null) {
  const [status, setStatus] = useState<PushStatus>("idle");
  const [isEnabling, setIsEnabling] = useState(false);

  // Sync state with browser Notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setStatus("enabled");
      } else if (Notification.permission === "denied") {
        setStatus("blocked");
      }
    }
  }, []);

  const enablePushNotifications = useCallback(async (): Promise<boolean> => {
    if (!userId || typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    setIsEnabling(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("blocked");
        setIsEnabling(false);
        return false;
      }

      const supported = await isSupported();
      if (!supported) {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }

      const messaging = getFirebaseMessaging();
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!messaging || !vapidKey) {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }

      const registration = await navigator.serviceWorker.register(
        "/api/firebase-sw",
        { scope: "/" },
      );

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }

      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus("enabled");
        setIsEnabling(false);
        return true;
      } else {
        setStatus("error");
        setIsEnabling(false);
        return false;
      }
    } catch (err) {
      console.error("Failed to enable push notifications:", err);
      setStatus("error");
      setIsEnabling(false);
      return false;
    }
  }, [userId]);

  return {
    status,
    isEnabling,
    enablePushNotifications,
  };
}
