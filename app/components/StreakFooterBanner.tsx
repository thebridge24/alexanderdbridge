/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaLock, FaGripLines, FaClock } from "react-icons/fa6";
import confetti from "canvas-confetti";
import pkg from "@/package.json";

const APP_VERSION = pkg.version;

interface StreakFooterBannerProps {
  currentStreak: number;
  dwellSeconds?: number;
  minDwellSeconds?: number; // 300 seconds default (5 mins)
  isAlreadyCompleted?: boolean;
  onMarkAsRead?: () => void;
}

export default function StreakFooterBanner({
  currentStreak,
  dwellSeconds = 0,
  minDwellSeconds = 300,
  isAlreadyCompleted = false,
  onMarkAsRead,
}: StreakFooterBannerProps) {
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const dragConstraintsRef = useRef<HTMLDivElement>(null);

  // Compute remaining countdown for the full 5-minute auto-complete
  const remainingSeconds = Math.max(0, minDwellSeconds - dwellSeconds);
  const isCompleted = isAlreadyCompleted || remainingSeconds === 0;

  // Rule: Button remains disabled for the first 3 minutes (180 seconds)
  const MIN_READ_LOCK_SECONDS = 180;
  const isMarkAsReadLocked = dwellSeconds < MIN_READ_LOCK_SECONDS;
  const lockTimeRemaining = Math.max(0, MIN_READ_LOCK_SECONDS - dwellSeconds);

  // Trigger confetti explosion
  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, []);

  // Monitor completion state to trigger celebration once per day
  useEffect(() => {
    if (isCompleted) {
      const today = new Date().toISOString().split("T")[0];
      const lastCelebrated = localStorage.getItem("last_streak_celebration_date");

      if (lastCelebrated !== today) {
        localStorage.setItem("last_streak_celebration_date", today);
        setShowCelebration(true);
        fireConfetti();
      }
    }
  }, [isCompleted, fireConfetti]);

  const handleManualComplete = () => {
    if (isMarkAsReadLocked) return;

    if (onMarkAsRead) {
      onMarkAsRead();
    }
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem("last_streak_celebration_date", today);
    setShowCelebration(true);
    fireConfetti();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Generate full 7 week day chips (Su - Sa)
  const renderWeekDays = () => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const todayIndex = new Date().getDay();

    return days.map((dayLabel, index) => {
      const isPast = index < todayIndex;
      const isToday = index === todayIndex;

      return (
        <div key={dayLabel} className="flex flex-col items-center gap-1.5">
          <span
            className={`text-[11px] font-medium transition-colors ${
              isToday ? "text-white font-bold" : "text-neutral-400"
            }`}
          >
            {dayLabel}
          </span>
          <div
            className={`size-8 rounded-full flex items-center justify-center transition-all ${
              isPast
                ? "bg-neutral-800 text-neutral-200"
                : isToday
                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(255,0,0,0.5)] scale-105"
                : "border border-neutral-800 bg-neutral-900/50 text-neutral-600"
            }`}
          >
            {isPast ? (
              <FaCheck className="size-3 text-neutral-300" />
            ) : isToday ? (
              <FaCheck className="size-3.5 text-white" />
            ) : null}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Full-screen constraint boundary for dragging */}
      <div
        ref={dragConstraintsRef}
        className="fixed inset-0 pointer-events-none z-50 p-4"
      >
        {/* Floating Draggable Reading Timer */}
        {!isCompleted && (
          <motion.div
            drag
            dragConstraints={dragConstraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto absolute top-6 right-6 flex items-center gap-2.5 px-3.5 py-2 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 rounded-full shadow-2xl cursor-grab active:cursor-grabbing hover:border-neutral-700 transition-colors select-none"
          >
<<<<<<< HEAD
            Built By Stackgate International
          </a>
          <span className="text-white/30 text-[10px] font-mono border border-white/10 px-1.5 py-0.5 rounded">
            v{APP_VERSION}
          </span>
        </span>
      </p>
=======
            <FaGripLines className="size-3 text-neutral-500 shrink-0" />
>>>>>>> eaef6b6b211422249ada03b6b8a7c5bee68c5de5

            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-300">
              <FaClock className="size-3 text-red-500 animate-pulse" />
              <span className="text-[11px] text-neutral-400 font-mono">Timer:</span>
              <span className="font-mono text-white font-bold text-sm tracking-wide">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <footer className="w-full flex flex-col items-center justify-center pt-8 pb-12 px-4 relative z-20 border-t border-white/10">
        {/* Footer Container */}
        <div className="w-full max-w-sm text-center flex flex-col items-center gap-4 text-xs md:text-sm text-white/40 font-light tracking-wide leading-relaxed">
          {isCompleted ? (
            <span className="w-full text-red-500 font-medium text-sm">
              Daily devotional time completed for today!
            </span>
          ) : (
            <div className="w-full flex flex-col items-center gap-3.5">
              {/* Wide, Red "Mark as Read" Button */}
              {onMarkAsRead && (
                <button
                  type="button"
                  disabled={isMarkAsReadLocked}
                  onClick={handleManualComplete}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 border ${
                    isMarkAsReadLocked
                      ? "bg-neutral-900 border-neutral-800 text-neutral-500 cursor-not-allowed opacity-60"
                      : "bg-red-600 hover:bg-red-700 active:scale-[0.98] border-red-500/30 text-white cursor-pointer"
                  }`}
                >
                  {isMarkAsReadLocked ? (
                    <>
                      <FaLock className="size-3.5 text-neutral-500" />
                      <span>
                        Mark as Read (Unlock in {formatTime(lockTimeRemaining)})
                      </span>
                    </>
                  ) : (
                    <>
                      <FaCheck className="size-4" />
                      <span>Mark as Read Now</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="inline-flex items-center gap-2 pt-1">
            <a
              href="https://stackgate.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/80 underline decoration-white/20 underline-offset-4 transition-colors font-normal text-xs"
            >
              Built By Stackgate International
            </a>
            <div className="text-white/30 text-[10px] font-mono border border-white/10 px-1.5 py-0.5 rounded">
              v{version}
            </div>
          </div>
        </div>

        {/* Modal Celebration Popup */}
        <AnimatePresence>
          {showCelebration && (
            <div className="fixed inset-0 z-100 flex items-end justify-center p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 300 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 300 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="w-full max-w-sm rounded-4xl bg-neutral-950 border border-neutral-800/80 p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
              >
                {/* Central Glowing Number Badge */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="size-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <span className="text-5xl font-black text-white tracking-tight">
                      {currentStreak > 0 ? currentStreak : 1}
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full border border-white/5 animate-ping opacity-25" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-white tracking-tight mt-2 mb-6">
                  Completed today!
                </h3>

                {/* Day Chips */}
                <div className="flex items-center justify-center gap-3 mb-8 w-full">
                  {renderWeekDays()}
                </div>

                {/* Continue Button */}
                <button
                  type="button"
                  onClick={() => setShowCelebration(false)}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm transition-all border border-neutral-700/50 shadow-lg"
                >
                  Continue
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </footer>
    </>
  );
}
