/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck } from "react-icons/fa6";
import confetti from "canvas-confetti";

// Import version directly from package.json
import { version } from "@/package.json";

interface StreakFooterBannerProps {
  currentStreak: number;
  onStreakIncrement?: () => void;
  targetDurationSeconds?: number; // Defaults to 300 (5 minutes)
  isAlreadyCompleted?: boolean;
}

export default function StreakFooterBanner({
  currentStreak,
  onStreakIncrement,
  targetDurationSeconds = 300,
  isAlreadyCompleted = false,
}: StreakFooterBannerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(targetDurationSeconds);
  const [isCompleted, setIsCompleted] = useState<boolean>(isAlreadyCompleted);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger confetti explosion
  const fireConfetti = useCallback(() => {
    // Center-burst confetti burst matching the image layout
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#ffffff"],
      disableForReducedMotion: true,
    });
  }, []);

  const handleStreakComplete = useCallback(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastCelebrated = localStorage.getItem("last_streak_celebration_date");

    // Only fire celebration once per calendar day
    if (lastCelebrated !== today) {
      localStorage.setItem("last_streak_celebration_date", today);
      setShowCelebration(true);
      fireConfetti();

      if (onStreakIncrement) {
        onStreakIncrement();
      }
    }
  }, [onStreakIncrement, fireConfetti]);

  // Check on load if today was already completed
  useEffect(() => {
    if (isAlreadyCompleted) {
      setIsCompleted(true);
      setTimeLeft(0);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const lastCelebrated = localStorage.getItem("last_streak_celebration_date");

    if (lastCelebrated === today) {
      setIsCompleted(true);
      setTimeLeft(0);
    }
  }, [isAlreadyCompleted]);

  // 5-Minute Countdown logic
  useEffect(() => {
    if (isCompleted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsCompleted(true);
          handleStreakComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, handleStreakComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Generate full 7 week day chips (Su - Sa)
  const renderWeekDays = () => {
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const todayIndex = new Date().getDay(); // 0 (Sun) to 6 (Sat)

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
    <footer className="w-full flex flex-col items-center justify-center pt-8 pb-12 px-4 relative z-20 border-t border-white/30">
      {/* Footer Text */}
      <p className="text-center flex flex-col items-center gap-1 text-xs md:text-sm text-white/40 font-light tracking-wide leading-relaxed">
        {isCompleted ? (
          <span className="text-red-600/80 font-medium">
            Daily devotional time completed for today!
          </span>
        ) : (
          <span>
            You need to read the devotional and pray for at least{" "}
            <span className="font-mono text-white/70 font-semibold px-1.5 py-0.5 text-2xl">
              {formatTime(timeLeft)}
            </span>
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <a
            href="https://stackgate.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white/80 underline decoration-white/20 underline-offset-4 transition-colors font-normal"
          >
            Built By Stackgate International
          </a>
          <span className="text-white/30 text-[10px] font-mono border border-white/10 px-1.5 py-0.5 rounded">
            v{version}
          </span>
        </span>
      </p>

      {/* Modal Popup matching design */}
      <AnimatePresence>
        {showCelebration && (
          <div className="fixed inset-0 z-100 flex items-end justify-center p-4 bg-black/60">
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 300 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="w-full max-w-sm rounded-4xl bg-neutral-950 border border-neutral-800/80 p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
            >
              {/* Central Glowing Number Badge */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="size-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center ">
                  <span className="text-5xl font-black text-white tracking-tight">
                    {currentStreak + 1}
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
  );
}
