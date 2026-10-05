"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaChevronUp, FaChevronDown, FaCheck, FaBell } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getToken, isSupported } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase/client";
import { playAlarmSound } from "@/lib/utils/sound";

interface ReminderTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  onSuccess?: (savedTime: string) => void;
  initialTime?: string; // e.g. "05:00:00" or "05:00"
}

export default function ReminderTimePicker({
  isOpen,
  onClose,
  userId,
  onSuccess,
  initialTime = "05:00:00",
}: ReminderTimePickerProps) {
  // Parse initial hour, minute, and period (AM/PM)
  const parseTime = (timeStr: string) => {
    const [hStr, mStr] = (timeStr || "05:00").split(":");
    let h = parseInt(hStr, 10) || 5;
    const m = parseInt(mStr, 10) || 0;
    const isPm = h >= 12;
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    return { hour: h, minute: m, isPm };
  };

  const initial = parseTime(initialTime);
  const [hour, setHour] = useState<number>(initial.hour);
  const [minute, setMinute] = useState<number>(initial.minute);
  const [isPm, setIsPm] = useState<boolean>(initial.isPm);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const incrementHour = () => {
    setHour((prev) => (prev === 12 ? 1 : prev + 1));
  };

  const decrementHour = () => {
    setHour((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const incrementMinute = () => {
    setMinute((prev) => (prev === 55 ? 0 : prev + 5));
  };

  const decrementMinute = () => {
    setMinute((prev) => (prev === 0 ? 55 : prev - 5));
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Convert 12h to 24h format string
    let h24 = hour;
    if (isPm && hour !== 12) h24 = hour + 12;
    if (!isPm && hour === 12) h24 = 0;

    const formattedTime = `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    const timezone =
      Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || "UTC";

    try {
      const supabase = createSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      const accessToken = session?.access_token;

      if (accessToken) {
        await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reminder_time: formattedTime,
            timezone,
            reminder_enabled: true,
          }),
        });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bridge_devotional_reminder_configured", "true");
        localStorage.setItem("bridge_devotional_reminder_time", formattedTime);

        // Prompt browser push permission and subscribe device to FCM
        if ("Notification" in window) {
          try {
            if (Notification.permission === "default") {
              await Notification.requestPermission();
            }
            if (Notification.permission === "granted") {
              const supported = await isSupported();
              if (supported) {
                const messaging = getFirebaseMessaging();
                const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
                if (messaging && vapidKey) {
                  const registration = await navigator.serviceWorker.register(
                    "/api/firebase-sw",
                    { scope: "/" }
                  );
                  const token = await getToken(messaging, {
                    vapidKey,
                    serviceWorkerRegistration: registration,
                  });
                  if (token && accessToken) {
                    await fetch("/api/notifications/subscribe", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                      },
                      body: JSON.stringify({ token }),
                    });
                  }
                }
              }
            }
          } catch (pushErr) {
            console.error("Push registration error in reminder picker:", pushErr);
          }
        }
      }

      playAlarmSound();
      onSuccess?.(formattedTime);
      onClose();
    } catch (err) {
      console.error("Error saving reminder preference:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl p-6 text-center relative overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              aria-label="Close"
            >
              <IoClose className="size-5" />
            </button>

            {/* Header Icon with Alarm Audio Preview */}
            <button
              type="button"
              onClick={() => playAlarmSound()}
              title="Test alarm beep sound"
              className="mx-auto size-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#ff0000] mb-3 shadow-inner hover:scale-105 active:scale-95 transition-transform"
            >
              <FaBell className="size-5" />
            </button>

            <h3 className="text-lg font-bold text-neutral-100 mb-1">
              Daily Devotional Alarm
            </h3>
            <p className="text-xs text-neutral-400 font-light max-w-xs mx-auto mb-6">
              Set the exact morning time you’d love to receive your devotional reminder.
            </p>

            {/* Digital Watch Clock Display Card */}
            <div className="p-4 rounded-2xl bg-black border border-neutral-800/90 shadow-inner mb-6 relative">
              <div className="flex items-center justify-center gap-3">
                {/* Hour Column */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementHour}
                    className="p-1.5 text-neutral-500 hover:text-white active:scale-90 transition-all"
                    aria-label="Increment hour"
                  >
                    <FaChevronUp className="size-3" />
                  </button>
                  <span className="font-mono text-4xl font-extrabold tracking-tight text-white select-none py-1">
                    {String(hour).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={decrementHour}
                    className="p-1.5 text-neutral-500 hover:text-white active:scale-90 transition-all"
                    aria-label="Decrement hour"
                  >
                    <FaChevronDown className="size-3" />
                  </button>
                </div>

                {/* Colon separator */}
                <span className="font-mono text-3xl font-extrabold text-[#ff0000] pb-2 animate-pulse">
                  :
                </span>

                {/* Minute Column */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementMinute}
                    className="p-1.5 text-neutral-500 hover:text-white active:scale-90 transition-all"
                    aria-label="Increment minute"
                  >
                    <FaChevronUp className="size-3" />
                  </button>
                  <span className="font-mono text-4xl font-extrabold tracking-tight text-white select-none py-1">
                    {String(minute).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={decrementMinute}
                    className="p-1.5 text-neutral-500 hover:text-white active:scale-90 transition-all"
                    aria-label="Decrement minute"
                  >
                    <FaChevronDown className="size-3" />
                  </button>
                </div>

                {/* AM / PM Toggle */}
                <div className="flex flex-col gap-1.5 ml-2">
                  <button
                    type="button"
                    onClick={() => setIsPm(false)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      !isPm
                        ? "bg-[#ff0000] text-white shadow-[0_0_10px_rgba(255,0,0,0.4)]"
                        : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPm(true)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      isPm
                        ? "bg-[#ff0000] text-white shadow-[0_0_10px_rgba(255,0,0,0.4)]"
                        : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-neutral-500 font-mono tracking-wider">
                DEFAULT: 05:00 AM
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3.5 px-4 rounded-full bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <FaCheck className="size-3 text-[#ff0000]" /> Set Reminder
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors font-medium"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
