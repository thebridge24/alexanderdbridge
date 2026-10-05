/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { IoClose } from "react-icons/io5";
import { MONTH_THEME } from "@/app/data/devotionalData";

export default function MonthlyCelebration() {
  const [showPopup, setShowPopup] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  useEffect(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();

    // Check if today is the 1st day of the month
    if (dayOfMonth === 1) {
      const monthName = today.toLocaleString("en-US", { month: "long" });
      setCurrentMonth(monthName);

      // Trigger celebration 6 seconds after page load
      const timer = setTimeout(() => {
        // Trigger Canvas Confetti for 3 seconds
        const end = Date.now() + 3 * 1000;
        const colors = ["#ffffff", "#ff0000", "#171717"]; // White, Red, Black/Dark Neutral

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: colors,
            zIndex: 9999,
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: colors,
            zIndex: 9999,
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();
        setShowPopup(true);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {showPopup && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl relative text-center overflow-hidden"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-[#ff0000] to-transparent" />

            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 transition-all active:scale-90"
              aria-label="Close"
            >
              <IoClose className="w-4 h-4" />
            </button>

            <div className="mt-2 space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                New Chapter
              </span>

              <h3 className="text-2xl font-black text-white tracking-tight">
                Welcome to {currentMonth}! 🎊
              </h3>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 my-4">
                <span className="text-[11px] font-bold tracking-wider text-neutral-500 uppercase block mb-1">
                  Theme of the Month
                </span>
                <p className="text-base font-semibold text-neutral-200">
                  {MONTH_THEME}
                </p>
              </div>

              <button
                onClick={() => setShowPopup(false)}
                className="w-full py-3 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shadow-lg active:scale-95"
              >
                Continue Devotional
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
