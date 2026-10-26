/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import { FiHeart } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import PushNotifications from "../api/notifications/PushNotifications";
import AuthButton from "@/app/auth/AuthButton";
import FloatingVideoPlayer from "./FloatingVideoPlayer";
import { SUPPORT_MESSAGES } from "@/lib/utils/support-messages";
import { useStreakTracker } from "@/app/hooks/useStreakTracker";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch current auth user for streak/attendance lookup
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use the streak tracker hook with the authenticated user ID
  const { streakData } = useStreakTracker(user?.id);

  // Random slide down & hide loop for support messages
  useEffect(() => {
    const triggerInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * SUPPORT_MESSAGES.length);
      setCurrentMessageIndex(randomIndex);
      setShowBubble(true);

      setTimeout(() => {
        setShowBubble(false);
      }, 4000);
    }, 15000);

    return () => clearInterval(triggerInterval);
  }, []);

  // Compute completed attendance count from streak data history
  const completedAttendanceCount = (() => {
    const history = streakData?.attendanceHistory || {};
    return Object.values(history).filter(
      (record: any) => record?.completed === true,
    ).length;
  })();

  // Show video only if completed attendance history is 7 days or more
  const showVideoPlayer = completedAttendanceCount >= 7;

  return (
    <header className="fixed top-4 left-0 right-0 max-w-2xl mx-auto px-6 flex items-center justify-between z-100 pointer-events-none">
      {/* Back Button */}
      <div className="pointer-events-auto">
        <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl">
          <Link
            href="/"
            className="size-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <IoArrowBack className="size-5" />
          </Link>
        </div>
      </div>

      {/* Right Controls: Support Button, Push Notifications & Auth Dropdown */}
      <div className="flex items-center gap-2.5 pointer-events-auto relative">
        {/* Support Button & Sliding Bubble Container */}
        <div className="relative flex flex-col items-end">
          <Link
            href="/support"
            className="flex items-center gap-1.5 px-4 h-11 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-950/50 backdrop-blur-md border border-primary/40 active:scale-95 transition-all animate-shake-btn"
          >
            <FiHeart className="size-3.5 fill-current" />
            <span>Support</span>
          </Link>

          {/* Random Sliding Bubble Text Underneath */}
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{ opacity: 1, y: 4, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.9 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-3 py-1.5 rounded-full bg-white border border-neutral-800 text-[10px] font-medium text-black shadow-2xl backdrop-blur-md whitespace-nowrap z-50 pointer-events-none"
              >
                {SUPPORT_MESSAGES[currentMessageIndex]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <PushNotifications />
        <AuthButton />
      </div>

      {/* Floating Video Component (Conditional: Shown only when completed attendance >= 7 days) */}
      {showVideoPlayer && (
        <FloatingVideoPlayer
          videos={[
            {
              id: "devotional-vid-oct-13",
              videoUrl: "https://res.cloudinary.com/dd5ppwbyi/video/upload/v1791876484/lv_0_20261013082356_w01hdo.mp4",
              title: "Salutation from Author",
            },
          ]}
        />
      )}
    </header>
  );
}