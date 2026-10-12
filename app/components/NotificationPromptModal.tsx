"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Check } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface NotificationPromptModalProps {
  /** Optional delay in milliseconds before showing the modal (default: 3000ms) */
  delayMs?: number;
}

export default function NotificationPromptModal({
  delayMs = 3000,
}: NotificationPromptModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function checkUserAndPrompt() {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      // 1. Verify user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return; // Only show for logged in users

      // 2. Check if user already dismissed or enabled notifications in localStorage
      const dismissed = localStorage.getItem("bridge_notifications_prompted");
      if (dismissed) return;

      // 3. Trigger popup after configurable delay
      timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);
    }

    checkUserAndPrompt();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [delayMs]);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("bridge_notifications_prompted", "true");
    }
  };

  const handleEnableNotifications = async (onlyImportant: boolean = false) => {
    setIsSubmitting(true);
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setSubscribed(true);
          setTimeout(() => {
            handleClose();
          }, 1200);
        } else {
          alert("Notification permissions were denied in your browser settings.");
          handleClose();
        }
      } else {
        alert("Push notifications are not supported by your browser.");
        handleClose();
      }
    } catch (err) {
      console.error("Error requesting notifications:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 overflow-hidden">
          
          {/* Bottom Drawer Animation Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col justify-between text-white"
          >
            {/* Top Close Button */}
            <div className="flex items-center justify-between pb-4">
              <button
                onClick={handleClose}
                aria-label="Close modal"
                className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Graphic & Content Section */}
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              {/* Notification Icon Glow Ring */}
              <div className="relative w-16 h-16 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
                <Bell className="w-8 h-8 fill-red-500 text-red-500 animate-pulse" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full text-[9px] font-mono flex items-center justify-center font-bold text-white border border-black">
                  1
                </span>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Never miss a moment
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Get notified when new devotionals drop, friends reply to your comments, or daily streak milestones unlock[span_0](start_span)[span_0](end_span).
                </p>
              </div>

              {/* Sample Notification Preview Card Mock */}
              <div className="w-full bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-3 text-left space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <span className="text-red-500 font-bold uppercase">Bridge Daily</span>
                  <span>Just now</span>
                </div>
                <div className="text-xs font-medium text-neutral-200">
                  ✨ Today's Devotional is live: Walk in Wisdom and Grace.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6">
              {subscribed ? (
                <div className="w-full py-3.5 px-6 bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-full flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Notifications Enabled!</span>
                </div>
              ) : (
                <>
                  {/* Primary Enable Button */}
                  <button
                    onClick={() => handleEnableNotifications(false)}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] cursor-pointer"
                  >
                    <Bell className="w-4 h-4 fill-black" />
                    <span>Enable Notifications</span>
                  </button>

                  {/* Secondary Only Important Button */}
                  <button
                    onClick={() => handleEnableNotifications(true)}
                    disabled={isSubmitting}
                    className="w-full py-3 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-medium text-xs rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Only Important Notifications</span>
                  </button>
                </>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
