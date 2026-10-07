"use client";

import { useState, useEffect, useCallback } from "react";
import { enableDevicePush } from "@/lib/pusher/client";

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
    if (!userId) return false;

    setIsEnabling(true);
    const result = await enableDevicePush(userId);
    setStatus(result);
    setIsEnabling(false);
    return result === "enabled";
  }, [userId]);

  return {
    status,
    isEnabling,
    enablePushNotifications,
  };
}
