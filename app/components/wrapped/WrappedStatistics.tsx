"use client";

import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaFire, FaCheckCircle } from "react-icons/fa";

interface WrappedStatisticsProps {
  data: MonthlyWrappedData;
}

export function WrappedStatistics({ data }: WrappedStatisticsProps) {
  const stats = data.statistics;

  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6"
      >
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          MONTHLY STATISTICS
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight mt-1">
          Your Engagement Overview
        </h2>
      </motion.div>

      <div className="space-y-6 my-auto">
        {/* Dominant Completed Days Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between shadow-2xl"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
              Days Spent With The Word
            </span>
            <div className="text-4xl sm:text-5xl font-black text-white font-mono">
              {stats.completed} <span className="text-sm font-sans text-neutral-500">/ {stats.totalPublished}</span>
            </div>
          </div>
          <div className="size-14 rounded-2xl bg-red-950/50 border border-red-800/50 flex items-center justify-center text-red-500">
            <FaCheckCircle className="size-7" />
          </div>
        </motion.div>

        {/* 3 Metric Grid Cards */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center space-y-1"
          >
            <span className="text-[10px] font-mono text-neutral-400 uppercase block">Completion</span>
            <div className="text-xl font-black text-white font-mono">{stats.completionRate}%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center space-y-1"
          >
            <span className="text-[10px] font-mono text-neutral-400 uppercase block">Longest Streak</span>
            <div className="text-xl font-black text-primary font-mono flex items-center justify-center gap-1">
              <FaFire size={14} /> {stats.longestStreak}d
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-center space-y-1"
          >
            <span className="text-[10px] font-mono text-neutral-400 uppercase block">Days Missed</span>
            <div className="text-xl font-black text-neutral-400 font-mono">{stats.missed}</div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-center pb-6"
      >
        <p className="text-xs font-mono text-neutral-500">
          Tap right to check your medals →
        </p>
      </motion.div>
    </div>
  );
}