"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaShareNodes, FaCheck } from "react-icons/fa6";

interface WrappedOutroProps {
  data: MonthlyWrappedData;
  onClose?: () => void;
}

export function WrappedOutro({ data, onClose }: WrappedOutroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareText = `My ${data.period.monthName} Devotional Recap: I completed ${data.statistics.completed} days with the Word on Bridge Daily! 📖✨`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Bridge Wrapped",
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6"
      >
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          THAT&apos;S YOUR MONTH
        </span>
      </motion.div>

      <div className="space-y-6 my-auto py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-3xl font-black text-white tracking-tight">
            You completed {data.statistics.completed} devotionals this month.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed">
            Keep growing. Keep showing up. Keep building your life around the Word.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 space-y-2 text-center"
        >
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
            Looking Ahead
          </span>
          <p className="text-base font-bold text-white">
            See you in {data.period.comingMonth}!
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="space-y-3 pb-6"
      >
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all cursor-pointer"
        >
          {copied ? <FaCheck size={14} /> : <FaShareNodes size={14} />}
          <span>{copied ? "Link Copied to Clipboard!" : "Share My Wrapped"}</span>
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-neutral-800"
        >
          Close Recap
        </button>
      </motion.div>
    </div>
  );
}