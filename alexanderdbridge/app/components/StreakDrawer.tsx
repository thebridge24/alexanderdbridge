// components/devotional/StreakDrawer.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoLockClosed } from "react-icons/io5";
import { StreakData, MILESTONE_MEDALS } from "../../lib/types/streak";
import StreakMiniCalendar from "./StreakMiniCalendar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  streakData: StreakData;
  userName?: string;
  onSelectMedalToPreview?: (medalId: string) => void;
}

export default function StreakDrawer({
  isOpen,
  onClose,
  streakData,
  userName = "Believer",
}: Props) {
  const firstLetter = userName.trim().charAt(0).toUpperCase() || "B";

  // Assign a Gen Z Rank based on current streak
  const getGenZRank = (streak: number) => {
    if (streak >= 100) return "Legendary General";
    if (streak >= 50) return "Word Titan";
    if (streak >= 21) return "Faith Pioneer";
    if (streak >= 7) return "Daily Catalyst";
    return "Faith Novice";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex justify-end bg-black/70 backdrop-blur-sm">
          {/* Slide-in Panel from Right (90% width max) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-[90vw] sm:max-w-md h-full bg-black border-l border-neutral-800 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl"
          >
            {/* Header with Back Button */}
            <div className="p-6 sticky top-0 bg-black/90 backdrop-blur-md z-20 border-b border-neutral-900 flex items-center justify-between">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-full transition-all active:scale-95"
              >
                <IoArrowBack className="w-4 h-4" />
                Back To Devotional
              </button>
              <span className="text-[11px] font-mono text-neutral-500">
                Bridge Daily
              </span>
            </div>

            {/* Content Container */}
            <div className="p-6 space-y-8 flex-1">
              {/* Profile Avatar Header (TikTok Vibe) */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-neutral-900 border-2 border-[#ff0000] p-1 shadow-[0_0_25px_rgba(255,0,0,0.3)] flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-3xl font-black text-white">
                      {firstLetter}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 translate-x-1/2 right-1/2 flex justify-center shrink-0 min-w-16 bg-[#ff0000] text-white text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-black">
                    {streakData.currentStreak} DAYS
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {userName}
                  </h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ff0000] mt-0.5">
                    {getGenZRank(streakData.currentStreak)}
                  </p>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase">
                    Active Streak
                  </span>
                  <span className="text-xl font-black text-white">
                    {streakData.currentStreak} Days
                  </span>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3">
                  <span className="block text-[10px] font-bold text-neutral-500 uppercase">
                    All-Time Best
                  </span>
                  <span className="text-xl font-black text-white">
                    {streakData.bestStreak} Days
                  </span>
                </div>
              </div>

              {/* Attendance Mini Calendar */}
              <StreakMiniCalendar
                attendanceHistory={streakData.attendanceHistory}
              />

              {/* Gamified Medals Progression Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Streak Milestones & Medals
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {streakData.unlockedMedalIds.length} /{" "}
                    {MILESTONE_MEDALS.length} Unlocked
                  </span>
                </div>

                <div className="grid gap-3">
                  {MILESTONE_MEDALS.map((medal) => {
                    const isUnlocked = streakData.unlockedMedalIds.includes(
                      medal.id,
                    );
                    const MedalIcon = medal.icon;
                    return (
                      <div
                        key={medal.id}
                        className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                          isUnlocked
                            ? "bg-neutral-900/80 border-[#ff0000]/40 text-white shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                            : "bg-neutral-950 border-neutral-900 text-neutral-600"
                        }`}
                      >
                        {/* Icon Container */}
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                            isUnlocked
                              ? "bg-black border border-[#ff0000]/60 text-white shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                              : "bg-neutral-900 border border-neutral-800 text-neutral-600"
                          }`}
                        >
                          {isUnlocked ? (
                            <MedalIcon />
                          ) : (
                            <IoLockClosed className="w-5 h-5 text-neutral-700" />
                          )}
                        </div>

                        {/* Medal Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-sm font-bold truncate ${
                                isUnlocked ? "text-white" : "text-neutral-500"
                              }`}
                            >
                              {medal.name}
                            </h4>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isUnlocked
                                  ? "bg-[#ff0000] text-white"
                                  : "bg-neutral-900 text-neutral-600"
                              }`}
                            >
                              {medal.targetDays} D
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {medal.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
