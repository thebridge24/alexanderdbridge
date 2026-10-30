"use client";

import React from "react";
import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaBookmark, FaQuoteLeft } from "react-icons/fa6";

interface WrappedThemeProps {
  data: MonthlyWrappedData;
}

export function WrappedTheme({ data }: WrappedThemeProps) {
  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 pt-6"
      >
        <FaBookmark className="size-3.5 text-red-500" />
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          MONTHLY THEME & FOCUS
        </span>
      </motion.div>

      <div className="space-y-6 my-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {data.theme.title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed">
            {data.theme.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-5 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-3 relative overflow-hidden"
        >
          <FaQuoteLeft className="absolute -right-2 -bottom-2 text-neutral-800/50 size-16 pointer-events-none" />
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
            Anchor Scripture
          </span>
          <p className="text-xs sm:text-sm font-mono text-neutral-200 italic leading-relaxed">
            &quot;{data.theme.scripture}&quot;
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
          Tap right to view your timeline →
        </p>
      </motion.div>
    </div>
  );
}