// components/devotional/StreakFloatingButton.tsx
"use client";

import { useStreakTracker } from "../hooks/useStreakTracker";
import { useState } from "react";
import StreakDrawer from "./StreakDrawer";
import StreakCelebrationModal from "./StreakCelebrationModal";

interface Props {
  userName?: string;
}

export default function StreakFloatingButton({ userName = "Believer" }: Props) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    streakData,
    currentMilestoneTarget,
    newlyUnlockedMedal,
    clearNewMedalAlert,
  } = useStreakTracker();

  // Progress percentage towards next target
  const currentStreak = streakData.currentStreak;
  const progressPercent = Math.min(
    Math.round((currentStreak / currentMilestoneTarget) * 100),
    100
  );

  // SVG Circular stroke calculation
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <>
      {/* Floating Circular Trigger Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="w-12 h-12 rounded-full mb-3 bg-black/90 border border-neutral-800 backdrop-blur-xl shadow-2xl relative flex items-center justify-center group active:scale-90 transition-all cursor-pointer"
        aria-label="Streak Progress"
      >
        {/* SVG Circular Progress Ring */}
        <svg className="w-full h-full -rotate-90 p-0.5" viewBox="0 0 48 48">
          {/* Background Ring */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            className="text-neutral-800"
            fill="transparent"
          />
          {/* Active Progress Ring */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            stroke="#ff0000"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Streak Counter Fraction (e.g. 2/7) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black leading-none text-white">
            {currentStreak}
          </span>
          <span className="text-[7px] font-mono leading-none text-neutral-400 mt-0.5">
            /{currentMilestoneTarget}
          </span>
        </div>
      </button>

      {/* Slide-in Drawer */}
      <StreakDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        streakData={streakData}
        userName={userName}
      />

      {/* Celebration Popup when new streak milestone is completed */}
      <StreakCelebrationModal
        medal={newlyUnlockedMedal}
        onClose={clearNewMedalAlert}
        userName={userName}
      />
    </>
  );
}