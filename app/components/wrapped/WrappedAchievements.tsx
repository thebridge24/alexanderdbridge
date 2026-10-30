"use client";

import React from "react";
import { motion } from "framer-motion";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { FaTrophy, FaMedal } from "react-icons/fa";

interface WrappedAchievementsProps {
  data: MonthlyWrappedData;
}

export function WrappedAchievements({ data }: WrappedAchievementsProps) {
  const earnedAchievements = data.achievements.filter((a) => a.earned);

  return (
    <div className="h-full flex flex-col justify-between p-8 text-left bg-black select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6"
      >
        <span className="text-xs font-mono font-bold tracking-widest text-red-500 uppercase">
          ACHIEVEMENTS & MEDALS
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight mt-1">
          Milestones Unlocked
        </h2>
      </motion.div>

      <div className="space-y-4 my-auto py-4">
        {earnedAchievements.length > 0 ? (
          earnedAchievements.map((medal, idx) => (
            <motion.div
              key={medal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-5 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-4 shadow-xl"
            >
              <div className="size-14 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-500 shrink-0">
                <FaTrophy className="size-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{medal.name}</h3>
                  <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800/40">
                    Earned
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {medal.description}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl bg-neutral-900/50 border border-neutral-800 text-center space-y-4 my-auto"
          >
            <div className="size-16 rounded-full bg-neutral-800 mx-auto flex items-center justify-center text-neutral-400">
              <FaMedal className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Every day counts</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                You haven&apos;t collected a medal this month, but every day you spend growing in the Word counts. There&apos;s more ahead.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="text-center pb-6"
      >
        <p className="text-xs font-mono text-neutral-500">
          Tap right for your personal reflection →
        </p>
      </motion.div>
    </div>
  );
}