/* eslint-disable @next/next/no-img-element */
// components/devotional/StreakCelebrationModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Medal } from "@/lib/types/streak";
import { IoClose, IoShareSocial, IoCheckmark } from "react-icons/io5";
import { FaTrophy, FaArrowRight } from "react-icons/fa6";
import { useState, useRef } from "react";
import { toBlob } from "html-to-image";

interface Props {
  medal: Medal | null;
  onClose: () => void;
  userName?: string;
}

export default function StreakCelebrationModal({
  medal,
  onClose,
  userName = "Believer",
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!medal) return null;

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Convert the div card directly into a high-res PNG image blob
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High resolution for crisp social sharing
        backgroundColor: "#0a0a0a", // Pure black background anchor
      });

      if (!blob) {
        throw new Error("Failed to render image blob");
      }

      const file = new File([blob], `${medal.id}-achievement.png`, {
        type: "image/png",
      });

      const shareData = {
        title: "Bridge Daily Devotional Achievement",
        text: `🔥 I just unlocked the '${medal.name}' (${medal.targetDays}-Day Streak) on Bridge Daily Devotional! Join me:`,
        url: window.location.origin,
      };

      // 2. Share image file natively via Web Share API if supported
      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          ...shareData,
          files: [file],
        });
      } else if (navigator.share) {
        // Fallback to text + URL sharing
        await navigator.share(shareData);
      } else {
        // Desktop Fallback: Download image & copy CTA link
        const link = document.createElement("a");
        link.download = `${medal.id}-achievement.png`;
        link.href = URL.createObjectURL(blob);
        link.click();

        await navigator.clipboard.writeText(
          `${shareData.text} ${window.location.origin}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error("Error generating or sharing image:", err);
    } finally {
      setIsGenerating(false);
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

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full bg-neutral-900 border border-neutral-800 transition-colors z-20"
          >
            <IoClose className="w-5 h-5" />
          </button>

          {/* Card Graphic Container (Captured as Image) */}
          <div
            ref={cardRef}
            className="pt-4 pb-4 px-2 flex flex-col items-center bg-neutral-950 rounded-2xl relative"
          >
            {/* Main Trophy/Medal Icon with Glow Shadow */}
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative my-4"
            >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#ff0000]/30 rounded-full blur-3xl pointer-events-none" />

              <div className="w-28 h-28 rounded-full relative bg-neutral-900 border-2 border-[#ff0000] flex items-center justify-center text-5xl text-white">
                <MedalIcon className="w-12 h-12" />
              </div>
              <div className="absolute -bottom-2 translate-x-1/2 right-1/2 flex justify-center shrink-0 min-w-16 bg-[#ff0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-black shadow">
                {medal.targetDays} DAYS
              </div>
            </motion.div>

            <span className="text-xs font-bold uppercase tracking-widest text-[#ff0000] flex items-center gap-1.5 mb-1">
              <FaTrophy className="w-3 h-3" /> Milestone Reached
            </span>

            <h3 className="text-2xl font-black text-white tracking-tight">
              {medal.name}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-60">
              Congratulations{" "}
              <span className="text-white font-semibold">{userName}</span>! You
              completed {medal.targetDays} days of daily devotionals!
            </p>

            {/* Read Devotional CTA Banner inside the generated image */}
            <div className="mt-5 w-full py-2 px-3 rounded-xl bg-white/5 border border-neutral-800/80 flex items-center justify-between">
              <div className="flex gap-3 items-center">
                 <div className="size-10">
                <img src="../favicon.ico" alt="" />
              </div>
              <div className="text-left">
                <span className="block text-[9px] -mb-2 font-mono text-neutral-500 uppercase">
                  Bridge Daily Devotional
                </span>
                <span className="text-[11px] font-bold text-white">
                  Read Today&apos;s Word
                </span>
              </div>
              </div>
             
              <div className="w-6 h-6 rounded-full bg-[#ff0000] flex items-center justify-center text-white">
                <FaArrowRight className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>

          {/* Action Button (Excluded from Image Capture) */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleShareCard}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-full bg-[#ff0000] hover:bg-red-600 disabled:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,0,0,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <span className="animate-pulse">Generating Image...</span>
              ) : copied ? (
                <>
                  <IoCheckmark className="w-4 h-4" /> Image Saved & Link Copied
                </>
              ) : (
                <>
                  <IoShareSocial className="w-4 h-4" /> Share Achievement Image
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}