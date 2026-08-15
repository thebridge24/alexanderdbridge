// components/devotional/StreakCelebrationModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Medal } from "@/lib/types/streak";
import { IoClose, IoShareSocial, IoCheckmark } from "react-icons/io5";
import { FaTrophy } from "react-icons/fa6";
import { useState, useRef } from "react";

interface Props {
  medal: Medal | null;
  onClose: () => void;
  userName?: string;
}

export default function StreakCelebrationModal({ medal, onClose, userName = "Believer" }: Props) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!medal) return null;

  const handleShareCard = async () => {
    const shareText = `🔥 I just unlocked the '${medal.name}' (${medal.targetDays}-Day Streak Medal) on Bridge Daily Devotional!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bridge Daily Devotional Achievement",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const MedalIcon = medal.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-120 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-6 text-center shadow-2xl overflow-hidden"
        >
          {/* Ambient Glowing Light Flare Effect Behind Medal */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#ff0000]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full bg-neutral-900 border border-neutral-800 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>

          {/* Card Graphic Container */}
          <div ref={cardRef} className="pt-4 pb-2 flex flex-col items-center">
            {/* Main Trophy/Medal Icon with Light Shadow */}
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative my-4"
            >
              <div className="w-28 h-28 rounded-full bg-neutral-900 border-2 border-[#ff0000] flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(255,0,0,0.4)]">
                <MedalIcon className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#ff0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-black shadow">
                {medal.targetDays} DAYS
              </div>
            </motion.div>

            <span className="text-xs font-bold uppercase tracking-widest text-[#ff0000] flex items-center gap-1.5 mb-1">
              <FaTrophy className="w-3 h-3" /> Milestone Reached
            </span>

            <h3 className="text-2xl font-black text-white tracking-tight">{medal.name}</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-60">
              Congratulations <span className="text-white font-semibold">{userName}</span>! You completed {medal.targetDays} days of daily devotionals!
            </p>

            <div className="mt-4 px-3 py-1.5 rounded-full bg-white/5 border border-neutral-800 text-[11px] text-neutral-300 font-mono">
              Bridge Daily Devotional
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleShareCard}
              className="w-full py-3 px-4 rounded-full bg-[#ff0000] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.3)] active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <IoCheckmark className="w-4 h-4" /> Copied Link
                </>
              ) : (
                <>
                  <IoShareSocial className="w-4 h-4" /> Share Achievement
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}