"use client";

import React from "react";
import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaBookOpen } from "react-icons/fa6";

interface WrappedIntroProps {
  data: MonthlyWrappedData;
}

export function WrappedIntro({ data }: WrappedIntroProps) {
  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 pt-6"
      >
        <span className="size-2 rounded-full bg-red-600 animate-pulse" />
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          BRIDGE WRAPPED
        </span>
      </motion.div>

      <div className="space-y-6 my-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="size-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-500 shadow-2xl"
        >
          <FaBookOpen className="size-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Your month with the Word.
          </h1>
          <p className="text-sm font-medium text-neutral-400 leading-relaxed">
            Here&apos;s how the journey went for you this month.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="inline-block px-4 py-2 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono font-bold text-white shadow-inner"
        >
          {data.period.monthName} {data.period.year}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="text-center pb-6"
      >
        <p className="text-xs font-mono text-neutral-500 animate-bounce">
          Tap anywhere to see your journey →
        </p>
      </motion.div>
    </div>
  );
}