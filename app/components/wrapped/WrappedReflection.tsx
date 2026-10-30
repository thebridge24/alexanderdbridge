"use client";

import React from "react";
import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaHeartPulse } from "react-icons/fa6";

interface WrappedReflectionProps {
  data: MonthlyWrappedData;
}

export function WrappedReflection({ data }: WrappedReflectionProps) {
  const rate = data.statistics.completionRate;

  // Determine message based on attendance rules (Scenario A, B, C)
  let reflectionHeading = "";
  let reflectionBody = "";

  if (rate > 70) {
    reflectionHeading = "Remarkable consistency.";
    reflectionBody = "You showed up consistently this month. That's something worth celebrating. Keep building this habit. Growth comes from continually giving yourself to the Word.";
  } else if (rate >= 40) {
    reflectionHeading = "Good progress to build on.";
    reflectionBody = "You made some progress this month, and that's a good place to build from. There were days you showed up and days you missed. Don't let the missed days discourage you. Be more intentional about making room for the Word next month.";
  } else {
    reflectionHeading = "A fresh rhythm awaits.";
    reflectionBody = "Let's be honest. There were more days you missed than days you showed up. But don't let that discourage you. You can build a better rhythm next month. Start with one day at a time, and make room for God's Word in your daily routine.";
  }

  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6 flex items-center gap-2"
      >
        <FaHeartPulse className="text-red-500 size-4" />
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          PERSONAL REFLECTION
        </span>
      </motion.div>

      <div className="space-y-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {reflectionHeading}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed bg-neutral-900/60 p-5 rounded-3xl border border-neutral-800">
            {reflectionBody}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-center pb-6"
      >
        <p className="text-xs font-mono text-neutral-500">
          Tap right for your final summary →
        </p>
      </motion.div>
    </div>
  );
}