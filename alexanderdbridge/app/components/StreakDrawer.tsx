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

  // Find the first uncompleted milestone to mark as active
  const activeMilestoneIndex = MILESTONE_MEDALS.findIndex(
    (medal) => !streakData.unlockedMedalIds.includes(medal.id)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-99999 flex justify-end bg-black/80 backdrop-blur-md">
          {/* Backdrop dismiss click handler */}
          <div className="flex-1" onClick={onClose} />

          {/* Slide-in Panel taking 95% width */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-[95vw] max-w-[95vw] sm:max-w-md h-full bg-black border-l border-neutral-800 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl relative z-99999"
          >
            {/* Header with Back Button */}
            <div className="p-6 sticky top-0 bg-black/90 backdrop-blur-md z-30 border-b border-neutral-900 flex items-center justify-between">
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
              {/* Profile Avatar Header */}
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
                  {MILESTONE_MEDALS.map((medal, index) => {
                    const isUnlocked = streakData.unlockedMedalIds.includes(
                      medal.id
                    );
                    const isActiveTarget = index === activeMilestoneIndex;
                    const MedalIcon = medal.icon;

                    // Calculate progress for current active target
                    const previousTarget =
                      index > 0 ? MILESTONE_MEDALS[index - 1].targetDays : 0;
                    const daysToCurrentTarget =
                      medal.targetDays - previousTarget;
                    const currentProgressDays = Math.max(
                      0,
                      streakData.currentStreak - previousTarget
                    );
                    const progressPercent = Math.min(
                      100,
                      Math.round(
                        (currentProgressDays / daysToCurrentTarget) * 100
                      )
                    );

                    // Circular SVG attributes
                    const strokeWidth = 3;
                    const radius = 22;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset =
                      circumference - (progressPercent / 100) * circumference;

                    return (
                      <div
                        key={medal.id}
                        className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                          isUnlocked
                            ? "bg-neutral-900/80 border-[#ff0000]/40 text-white shadow-[0_0_15px_rgba(255,0,0,0.1)]"
                            : isActiveTarget
                            ? "bg-neutral-900/40 border-[#ff0000]/60 text-neutral-200"
                            : "bg-neutral-950 border-neutral-900 text-neutral-600"
                        }`}
                      >
                        {/* Icon Container with Progress Ring & Bottom-Right Lock */}
                        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                          {/* Radial Progress Ring for current active level */}
                          {isActiveTarget && (
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle
                                cx="24"
                                cy="24"
                                r={radius}
                                className="stroke-neutral-800"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r={radius}
                                className="stroke-[#ff0000] transition-all duration-500"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                            </svg>
                          )}

                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                              isUnlocked
                                ? "bg-black border border-[#ff0000]/60 text-[#ff0000] shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                                : "bg-neutral-900 border border-neutral-800 text-neutral-500 opacity-75"
                            }`}
                          >
                            <MedalIcon />
                          </div>

                          {/* Lock Badge on Bottom-Right */}
                          {!isUnlocked && (
                            <div className="absolute -bottom-1 -right-1 bg-neutral-950 border border-neutral-800 rounded-full p-1 text-neutral-400 shadow-md">
                              <IoLockClosed className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Medal Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`text-sm font-bold truncate ${
                                isUnlocked
                                  ? "text-white"
                                  : isActiveTarget
                                  ? "text-neutral-200"
                                  : "text-neutral-500"
                              }`}
                            >
                              {medal.name}
                            </h4>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isUnlocked
                                  ? "bg-[#ff0000] text-white"
                                  : isActiveTarget
                                  ? "bg-[#ff0000]/20 text-[#ff0000] border border-[#ff0000]/30"
                                  : "bg-neutral-900 text-neutral-600"
                              }`}
                            >
                              {medal.targetDays} D
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {medal.description}
                          </p>

                          {/* Progress bar text indicator for current target */}
                          {isActiveTarget && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#ff0000] rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-[#ff0000] font-bold">
                                {progressPercent}%
                              </span>
                            </div>
                          )}
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