/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useEffect, useState, useRef } from "react";
import { getToken, isSupported, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/alexanderdbridge/lib/firebase/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaRegBell } from "react-icons/fa6";
import { BsCheck2All } from "react-icons/bs";
import { FirstNotifications } from "@/app/data/notifications";

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

  // Firebase push listener setup
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

          setNotifications((prev) => [
            {
              id: Date.now().toString(),
              title: payload.notification?.title || "New Alert",
              body: payload.notification?.body || "",
              timestamp: "Just now",
              read: false,
              type: "admin",
            },
            ...prev,
          ]);
        }
      });
    });

    return () => unsubscribe?.();
  }, [userId]);

  const enableNotifications = async () => {
    if (!userId || !("Notification" in window)) return false;

    // Trigger native browser permission prompt if not granted yet
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("blocked");
      return false;
    }

    try {
      const messaging = getFirebaseMessaging();
      const firebaseConfigReady = Boolean(
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      );
      if (!messaging || !firebaseConfigReady) {
        setStatus("error");
        return false;
      }

      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
      );
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        setStatus("error");
        return false;
      }

      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase!.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setStatus("error");
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
        return true;
      } else {
        setStatus("error");
        return false;
      }
    } catch (error) {
      console.error("Unable to enable push notifications:", error);
      setStatus("error");
      return false;
    }
  };


  const handleToggleSwitch = async () => {
    if (isToggling || status === "enabled") return;
    setIsToggling(true);
    await enableNotifications();
    setIsToggling(false);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
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
    </div>
  );
}
