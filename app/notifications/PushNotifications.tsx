/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import type { Channel } from "pusher-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { disableDevicePush, enableDevicePush, getPusherClient } from "@/lib/pusher/client";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaRegBell } from "react-icons/fa6";
import { BsCheck2All } from "react-icons/bs";
import { FirstNotifications } from "@/app/data/notifications";
import { formatRelativeTime } from "@/lib/utils/date";
import { playNotificationSound, playAlarmSound, stopAlarmSound } from "@/lib/utils/sound";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: "like" | "reply" | "reminder" | "admin";
  link?: string;
}

export default function PushNotifications() {
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "enabled" | "blocked" | "error"
  >("idle");
  const [isToggling, setIsToggling] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(FirstNotifications);

  // In-app floating popup notification banner state
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    body: string;
    link?: string;
  } | null>(null);

  // Cross-device native browser notification trigger (works on Android, iOS, Windows, Mac)
  const displayBrowserNotification = useCallback(
    async (title: string, body: string, link?: string, type?: string, showNative = true) => {
      // Sound feature:
      // notification-ring for comment/reply/general notifications
      // alarm-beep for devotional alarms and reminders
      const isAlarm =
        type === "reminder" ||
        title.toLowerCase().includes("alarm") ||
        title.toLowerCase().includes("reminder");

      if (isAlarm) {
        playAlarmSound();
      } else {
        playNotificationSound();
      }

      // 1. Show the sleek in-app floating banner immediately on device
      setActiveToast({
        id: Date.now().toString(),
        title,
        body,
        link,
      });

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.title === title ? null : current));
        if (isAlarm) {
          stopAlarmSound();
        }
      }, 6000);

      // Server notifications arrive natively through Pusher Beams when the site isn't
      // focused, so only locally generated alerts (the alarm) need a native popup here.
      if (
        !showNative ||
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      // 2. Service Worker showNotification (standard for Mobile Android & modern PWAs)
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.showNotification) {
            const notifOptions: any = {
              body,
              icon: "/devotional.png",
              badge: "/devotional.png",
              vibrate: [200, 100, 200],
              tag: `bridge-${Date.now()}`,
              renotify: true,
              data: { url: link || "/devotional" },
              actions: [
                { action: "open", title: "Open" },
                { action: "close", title: "Dismiss" },
              ],
            };
            await reg.showNotification(title, notifOptions);
            return;

          }
        } catch (swErr) {
          console.warn("ServiceWorker showNotification fallback:", swErr);
        }
      }

      // 3. Fallback to desktop Notification constructor
      try {
        const n = new Notification(title, {
          body,
          icon: "/devotional.png",
        });
        n.onclick = () => {
          window.focus();
          stopAlarmSound();
          if (link) window.location.href = link;
        };
      } catch (err) {
        console.warn("Browser notification constructor error:", err);
      }
    },
    [],
  );

  // Fetch in-app notifications for the current user
  useEffect(() => {
    if (!userId) return;

  let mounted = true;

  async function loadNotifications() {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      // Get session access token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/notifications", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;
      const data = await res.json();
      if (!mounted) return;

      const items: NotificationItem[] = (data.notifications || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        timestamp: formatRelativeTime(n.created_at),
        read: Boolean(n.read),
        type: n.type,
        link: n.link || undefined,
      }));

      // Always update state (even if empty) to clear default mock data
      setNotifications(items);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  loadNotifications();

  // Live in-app delivery over the user's private Pusher Channels channel
  const pusher = getPusherClient();
  let channel: Channel | null = null;

  if (pusher) {
    const channelName = `private-user-${userId}`;
    channel = pusher.subscribe(channelName);
    channel.bind("notification", (n: any) => {
      if (!n?.id) return;

      displayBrowserNotification(n.title, n.body, n.link || undefined, n.type, false);

      setNotifications((prev) =>
        prev.some((item) => item.id === n.id)
          ? prev
          : [
              {
                id: n.id,
                title: n.title,
                body: n.body,
                timestamp: "Just now",
                read: Boolean(n.read),
                type: n.type,
                link: n.link || undefined,
              },
              ...prev,
            ],
      );
    });
  }

  return () => {
    mounted = false;
    if (pusher && channel) {
      channel.unbind("notification");
      pusher.unsubscribe(channel.name);
    }
  };
}, [userId, displayBrowserNotification]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep this device registered with Pusher Beams for the signed-in user. Runs silently
  // when permission was already granted (also migrates devices from the old FCM setup),
  // and unlinks the device when the user signs out.
  const previousUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = userId;

    if (!userId) {
      if (previousUserId) disableDevicePush();
      return;
    }

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      enableDevicePush(userId).then(setStatus);
    }
  }, [userId]);

  // Devotional Alarm Scheduler: checks local alarm time and rings alarm-beep if matched
  useEffect(() => {
    const checkDevotionalAlarm = () => {
      try {
        if (typeof window === "undefined") return;
        const configured = localStorage.getItem("bridge_devotional_reminder_configured");
        const reminderTime = localStorage.getItem("bridge_devotional_reminder_time");
        if (!configured || !reminderTime) return;

        const now = new Date();
        const currentH = String(now.getHours()).padStart(2, "0");
        const currentM = String(now.getMinutes()).padStart(2, "0");
        const currentTime = `${currentH}:${currentM}`;

        const [rH, rM] = reminderTime.split(":");
        const targetTime = `${(rH || "").padStart(2, "0")}:${(rM || "").padStart(2, "0")}`;

        const dateKey = now.toISOString().slice(0, 10);
        const alarmDoneKey = `bridge_alarm_triggered_${dateKey}`;

        if (currentTime === targetTime && !localStorage.getItem(alarmDoneKey)) {
          localStorage.setItem(alarmDoneKey, "true");
          displayBrowserNotification(
            "Daily Devotional Alarm",
            "It's time for your daily devotional with God! Tap to read.",
            "/devotional",
            "reminder"
          );
        }
      } catch (err) {
        console.warn("Devotional alarm scheduler error:", err);
      }
    };

    const interval = setInterval(checkDevotionalAlarm, 30000);
    checkDevotionalAlarm();
    return () => clearInterval(interval);
  }, [displayBrowserNotification]);

  const enableNotifications = async () => {
    if (!userId) return false;
    const result = await enableDevicePush(userId);
    setStatus(result);
    return result === "enabled";
  };

  const handleToggleSwitch = async () => {
    if (isToggling || status === "enabled") return;
    setIsToggling(true);
    await enableNotifications();
    setIsToggling(false);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );

    if (!userId) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    if (!userId) return;
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative size-11 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800/80 active:scale-90 transition-all shadow-2xl cursor-pointer"
        aria-label="Notifications"
      >
        <FaBell className="size-4" />
        {(unreadCount > 0 || status !== "enabled") && (
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-red-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute -right-14 mt-3 w-[90vw] sm:w-88 rounded-3xl bg-black/15 border border-white/10 backdrop-blur-2xl p-3 shadow-2xl z-50 text-left overflow-hidden flex flex-col max-h-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 pl-2">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-mono text-[10px] font-semibold border border-red-500/20">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-neutral-400 hover:text-white flex gap-1 items-center transition-colors cursor-pointer"
                  >
                    <BsCheck2All className="size-3" /> Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Morning Reminder Banner (Disappears completely once enabled) */}
            {status !== "enabled" && (
              <div className="mb-3 p-3 rounded-2xl bg-black/60 border border-white/10 shrink-0 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-neutral-200">
                    Morning Reminders
                  </p>
                  <p className="text-[10px] text-neutral-400 font-light">
                    {status === "blocked"
                      ? "Blocked in browser settings"
                      : status === "error"
                        ? "Couldn't enable push on this device. Tap to retry."
                        : "Daily push alerts"}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={false}
                  disabled={isToggling || status === "blocked"}
                  onClick={handleToggleSwitch}
                  className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ease-in-out cursor-pointer ${
                    status === "blocked"
                      ? "bg-neutral-800 opacity-50 cursor-not-allowed"
                      : "bg-neutral-700 hover:bg-neutral-600"
                  }`}
                >
                  <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="size-5 rounded-full bg-white shadow-md ml-0"
                  />
                </button>
              </div>
            )}

            {/* Notification Stream Feed */}
            <div className="overflow-y-auto space-y-2 pr-1 no-scrollbar flex-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  <FaRegBell className="size-6 mx-auto mb-2 opacity-40" />
                  No notifications yet
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 },
                    },
                  }}
                  className="space-y-2 p-1"
                >
                  {notifications.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.6, y: 15 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -10 }}
                      viewport={{ margin: "-10px" }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                        mass: 0.6,
                      }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      whileTap={{ scale: 1 }}
                      onClick={() => markAsRead(item.id)}
                      className={`p-3.5 rounded-2xl border backdrop-blur-xl transition-colors cursor-pointer relative group ${
                        item.read
                          ? "bg-white/3 border-white/5 opacity-70 hover:opacity-100"
                          : "bg-white/10 border-white/15 shadow-xl shadow-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-neutral-200 leading-tight">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono shrink-0 flex items-center gap-1">
                          {item.read ? (
                            <BsCheck2All className="size-3" />
                          ) : (
                            <span className="size-1.5 bg-red-500 rounded-full" />
                          )}
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300/80 font-light leading-relaxed">
                        {item.body}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating System-Style Browser Popup Banner for Mobile & Desktop */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            onClick={() => {
              stopAlarmSound();
              if (activeToast.link) {
                window.location.href = activeToast.link;
              }
              setActiveToast(null);
            }}
            className="fixed top-5 left-4 right-4 max-w-sm mx-auto z-100 bg-neutral-950/95 border border-red-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 cursor-pointer text-left pointer-events-auto"
          >
            <div className="size-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
              <FaBell className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-bold text-white truncate">
                  {activeToast.title}
                </h5>
                <span className="text-[10px] text-neutral-400 shrink-0">Just now</span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                {activeToast.body}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
