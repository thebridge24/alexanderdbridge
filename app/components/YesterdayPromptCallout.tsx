"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";

interface YesterdayPromptProps {
  currentDateString: string; // Format: YYYY-MM-DD
  yesterdayTopic?: string; // e.g. "Walking in Divine Purpose"
  isYesterdayRead?: boolean; // Pass true if user already completed yesterday's reading
}

export default function YesterdayPromptCallout({
  currentDateString,
  yesterdayTopic = "Yesterday's Devotional",
  isYesterdayRead = false,
}: YesterdayPromptProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [shakeKey, setShakeKey] = useState<number>(0);

  // Derive yesterday's date (YYYY-MM-DD)
  const yesterdayString = useMemo(() => {
    if (!currentDateString) return "";
    const parts = currentDateString.split("-");
    if (parts.length !== 3) return "";

    const [year, month, day] = parts.map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() - 1);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }, [currentDateString]);

  // Check if yesterday was completed locally or via props/dismissed state
  const checkReadStatus = useCallback(() => {
    if (isYesterdayRead) return true;

    // Local storage backup check for completed reading
    const readLogs = JSON.parse(
      localStorage.getItem("completed_devotionals") || "[]"
    );
    if (readLogs.includes(yesterdayString)) return true;

    const dismissedDate = localStorage.getItem("yesterday_prompt_dismissed");
    if (dismissedDate === currentDateString) return true;

    return false;
  }, [isYesterdayRead, yesterdayString, currentDateString]);

  // Interval loop: Appears for 20s -> Disappears for 30s -> Repeat
  useEffect(() => {
    if (checkReadStatus() || isDismissed || !yesterdayString) return;

    let hideTimer: NodeJS.Timeout;
    let reappearTimer: NodeJS.Timeout;

    const startCycle = () => {
      setIsVisible(true);

      // Hide after 20 seconds of being ignored
      hideTimer = setTimeout(() => {
        setIsVisible(false);

        // Re-appear after 30 seconds
        reappearTimer = setTimeout(() => {
          startCycle();
        }, 30000);
      }, 20000);
    };

    // First appearance delay (5s after page load)
    const initialTimer = setTimeout(() => {
      startCycle();
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(hideTimer);
      clearTimeout(reappearTimer);
    };
  }, [isDismissed, yesterdayString, checkReadStatus]);

  // Periodic Shake Effect every 3 seconds while visible
  useEffect(() => {
    if (!isVisible) return;

    const shakeInterval = setInterval(() => {
      setShakeKey((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(shakeInterval);
  }, [isVisible]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleNavigateToYesterday = () => {
    if (!yesterdayString) return;
    router.push(`/devotional/${yesterdayString}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isDismissed || checkReadStatus()) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="bubble-container"
          initial={{ opacity: 0, scale: 0.3, x: -60, y: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, x: -40, y: 10 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 18, // Bouncy spring effect
          }}
          className="fixed left-6 bottom-8 z-50 cursor-pointer"
          onClick={handleNavigateToYesterday}
        >
          {/* Inner Shake Container */}
          <motion.div
            key={shakeKey}
            animate={{
              rotate: [0, -4, 4, -3, 3, 0],
              x: [0, -2, 2, -1, 1, 0],
            }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="relative bg-neutral-200 text-neutral-950 font-sans rounded-bl-0 rounded-tl-[22px] rounded-tr-[22px] rounded-br-[22px] px-4 py-2.5 max-w-70 sm:max-w-xs shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-white/20 select-none flex items-center gap-2 pr-7 group"
          >


            {/* Content Text */}
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                Missed Yesterday?
              </span>
              <p className="text-xs font-semibold leading-tight text-neutral-900 truncate max-w-[60vw]">
                {yesterdayTopic}
              </p>
            </div>

            {/* Small Top-Right Cancel Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute -top-4.5 -right-2.5 size-5 rounded-full bg-white hover:bg-neutral-400/60 active:scale-90 flex items-center justify-center text-neutral-800 transition-all"
              aria-label="Dismiss prompt"
            >
              <IoClose className="size-3.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}