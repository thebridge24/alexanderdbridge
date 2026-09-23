"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IoClose, IoLockClosed } from "react-icons/io5";
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
  const [, setSelectedMedalPopup] = useState<string | null>(
    null
  );

  // Dynamically calculate the highest unlocked milestone target/name
  const unlockedMilestones = MILESTONE_MEDALS.filter((medal) =>
    streakData.unlockedMedalIds.includes(medal.id)
  );

  const currentUnlockedMilestone =
    unlockedMilestones.length > 0
      ? unlockedMilestones[unlockedMilestones.length - 1]
      : null;

  const currentRankTitle = currentUnlockedMilestone
    ? currentUnlockedMilestone.name
    : "Getting Started";

  // Find the first uncompleted milestone to mark as active focus
  const activeMilestoneIndex = MILESTONE_MEDALS.findIndex(
    (medal) => !streakData.unlockedMedalIds.includes(medal.id)
  );

  const activeMilestone =
    activeMilestoneIndex !== -1 ? MILESTONE_MEDALS[activeMilestoneIndex] : null;

  // Calculate progress percentage relative to next active milestone target or best streak
  const targetDays = activeMilestone
    ? activeMilestone.targetDays
    : streakData.bestStreak > 0
    ? streakData.bestStreak
    : 1;

  const mainProgressPercent = Math.min(
    100,
    Math.round((streakData.currentStreak / targetDays) * 100)
  );

  // Big Streak Ring SVG parameters
  const mainRadius = 44;
  const mainStrokeWidth = 4;
  const mainCircumference = 2 * Math.PI * mainRadius;
  const mainStrokeDashoffset =
    mainCircumference - (mainProgressPercent / 100) * mainCircumference;

  // Animations: Subtle pulse for unlocked badges
  const unlockedMedalAnimation: Variants = {
    animate: {
      y: [0, -3, 0],
      scale: [1, 1.03, 1],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
    hover: {
      scale: 1.1,
    },
  };

  // Animations: Glow ring for active targeted milestone
  const activeMilestoneAnimation: Variants = {
    initial: { boxShadow: "0 0 10px 2px rgba(255, 0, 0, 0.4)" },
    animate: {
      boxShadow: [
        "0 0 10px 2px rgba(255, 0, 0, 0.4)",
        "0 0 20px 4px rgba(255, 0, 0, 0.6)",
        "0 0 10px 2px rgba(255, 0, 0, 0.4)",
      ],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Main Sheet Container */}
          <div className="fixed inset-0 z-100 flex flex-col justify-end">
            {/* Dark Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Bottom Slide-Up Sheet Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="relative w-full max-w-xl mx-auto h-[85vh] max-h-[85vh] bg-neutral-950 border-t border-neutral-800 rounded-t-4xl flex flex-col overflow-hidden shadow-2xl z-10"
            >
              {/* Drag Handle & Header */}
              <div className="px-6 pt-3 pb-4 sticky top-0 bg-neutral-950/90 backdrop-blur-md z-30 border-b border-neutral-900 flex flex-col items-center">
                {/* Visual Grab Bar */}
                <div className="w-12 h-1.5 bg-neutral-700/60 rounded-full mb-3" />

                <div className="w-full flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Streak & Milestones
                    </h3>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-95"
                    aria-label="Close"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Main Content Area */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
                {/* 1. Main Streak Display with Radial Progress Ring */}
                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Progress Circle SVG Border */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r={mainRadius}
                        className="stroke-neutral-800/80"
                        strokeWidth={mainStrokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r={mainRadius}
                        className="stroke-[#ff0000] transition-all duration-700 ease-out"
                        strokeWidth={mainStrokeWidth}
                        strokeDasharray={mainCircumference}
                        strokeDashoffset={mainStrokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>

                    {/* Central Streak Number Display */}
                    <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-4xl font-black text-white shadow-inner z-10">
                      {streakData.currentStreak}
                    </div>

                    {/* Percentage Progress Pill Badge */}
                    <div className="absolute -bottom-1.5 z-20 bg-neutral-900 border border-[#ff0000]/60 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md tracking-wider">
                      {mainProgressPercent}%
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
                    Day Streak
                  </h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ff0000]">
                    {userName} • {currentRankTitle}
                  </p>
                </div>

                {/* 2. Mini Calendar Integration */}
                <StreakMiniCalendar
                  attendanceHistory={streakData.attendanceHistory}
                />

                {/* 3. Metrics Overview */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3">
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase">
                      All-Time Best
                    </span>
                    <span className="text-xl font-black text-white">
                      {streakData.bestStreak} Day{streakData.bestStreak > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3">
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase">
                      Total Unlocks
                    </span>
                    <span className="text-xl font-black text-white">
                      {streakData.unlockedMedalIds.length} Medals
                    </span>
                  </div>
                </div>

                {/* 4. Milestone List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Streak Milestones
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

                      // Radial Progress calculations
                      const strokeWidth = 3;
                      const radius = 22;
                      const circumference = 2 * Math.PI * radius;
                      const progressPercent = isActiveTarget
                        ? Math.min(
                            100,
                            Math.round(
                              (streakData.currentStreak / medal.targetDays) *
                                100
                            )
                          )
                        : isUnlocked
                        ? 100
                        : 0;
                      const strokeDashoffset =
                        circumference -
                        (progressPercent / 100) * circumference;

                      return (
                        <div
                          key={medal.id}
                          onClick={() => {
                            if (isUnlocked) {
                              setSelectedMedalPopup(medal.id);
                            }
                          }}
                          className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                            isUnlocked
                              ? "bg-neutral-900/80 border-[#ff0000]/40 text-white shadow-[0_0_15px_rgba(255,0,0,0.1)] cursor-pointer"
                              : isActiveTarget
                              ? "bg-neutral-900/40 border-[#ff0000]/60 text-neutral-200"
                              : "bg-neutral-950 border-neutral-900 text-neutral-600"
                          }`}
                        >
                          {/* Radial Progress Ring */}
                          <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
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
                                className={`transition-all duration-500 ${
                                  isUnlocked
                                    ? "stroke-white"
                                    : "stroke-[#ff0000]"
                                }`}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                              />
                            </svg>

                            <motion.div
                              variants={
                                isUnlocked
                                  ? unlockedMedalAnimation
                                  : isActiveTarget
                                  ? activeMilestoneAnimation
                                  : undefined
                              }
                              initial={
                                isUnlocked
                                  ? "animate"
                                  : isActiveTarget
                                  ? "initial"
                                  : undefined
                              }
                              animate={
                                isUnlocked
                                  ? "animate"
                                  : isActiveTarget
                                  ? "animate"
                                  : undefined
                              }
                              whileHover={isUnlocked ? "hover" : undefined}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                                isUnlocked
                                  ? "bg-black border border-white/60 text-white animate-bounce"
                                  : "bg-neutral-900 border border-neutral-800 text-neutral-500 opacity-75"
                              }`}
                            >
                              <MedalIcon />
                            </motion.div>

                            {!isUnlocked && (
                              <div className="absolute -bottom-1 -right-1 bg-neutral-950 border border-neutral-800 rounded-full p-1 text-neutral-400 shadow-md">
                                <IoLockClosed className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-sm font-bold truncate ${
                                  isUnlocked ? "text-white" : "text-neutral-300"
                                }`}
                              >
                                {medal.name}
                              </h4>
                              <span className="text-xs font-semibold text-neutral-500">
                                {medal.targetDays} Days
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 truncate">
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
        </>
      )}
    </AnimatePresence>
  );
}