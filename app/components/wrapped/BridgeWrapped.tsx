"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";
import { WrappedIntro } from "./WrappedIntro";
import { WrappedTheme } from "./WrappedTheme";
import { WrappedTimeline } from "./WrappedTimeline";
import { WrappedStatistics } from "./WrappedStatistics";
import { WrappedAchievements } from "./WrappedAchievements";
import { WrappedReflection } from "./WrappedReflection";
import { WrappedOutro } from "./WrappedOutro";
import { WrappedProgress } from "./WrappedProgress";

export interface BridgeWrappedProps {
  userId: string;
  currentDate?: Date | string;
  forceShow?: boolean;
  onClose?: () => void;
}

export function BridgeWrapped({
  userId,
  currentDate,
  forceShow = false,
  onClose,
}: BridgeWrappedProps) {
  const [data, setData] = useState<MonthlyWrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  useEffect(() => {
    async function fetchWrapped() {
      try {
        setLoading(true);
        const dateQuery = currentDate ? `&currentDate=${encodeURIComponent(String(currentDate))}` : "";
        const res = await fetch(`/api/devotional/wrapped?userId=${userId}${dateQuery}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.wrapped);
        }
      } catch (err) {
        console.error("Failed to load Bridge Wrapped:", err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) fetchWrapped();
  }, [userId, currentDate]);

  // Determine pagination screens for timeline (7 entries per screen)
  const timelinePages = data?.devotionals
    ? Math.ceil(data.devotionals.length / 7)
    : 1;

  // Total screens: Intro (1) + Theme (1) + Timeline Pages (N) + Stats (1) + Achievements (1) + Reflection (1) + Outro (1)
  const totalScreens = 6 + timelinePages;

  const handleNext = useCallback(() => {
    setCurrentStoryIndex((prev) => Math.min(prev + 1, totalScreens - 1));
  }, [totalScreens]);

  const handlePrev = useCallback(() => {
    setCurrentStoryIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  if (loading || !data) return null;

  // Visibility check
  if (!forceShow && !data.period.isLastDayOfMonth) {
    return null;
  }

  const renderStoryScreen = () => {
    if (currentStoryIndex === 0) return <WrappedIntro data={data} />;
    if (currentStoryIndex === 1) return <WrappedTheme data={data} />;

    // Timeline screens (Index 2 to 2 + timelinePages - 1)
    if (currentStoryIndex >= 2 && currentStoryIndex < 2 + timelinePages) {
      const pageIdx = currentStoryIndex - 2;
      const start = pageIdx * 7;
      const chunk = data.devotionals.slice(start, start + 7);
      return (
        <WrappedTimeline
          devotionals={chunk}
          pageIndex={pageIdx}
          totalPages={timelinePages}
          monthName={data.period.monthName}
        />
      );
    }

    const offset = 2 + timelinePages;
    if (currentStoryIndex === offset) return <WrappedStatistics data={data} />;
    if (currentStoryIndex === offset + 1) return <WrappedAchievements data={data} />;
    if (currentStoryIndex === offset + 2) return <WrappedReflection data={data} />;
    if (currentStoryIndex === offset + 3) return <WrappedOutro data={data} onClose={onClose} />;

    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4"
      >
        {/* Phone Container */}
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-105 h-full sm:h-210 bg-black sm:rounded-[40px] border border-neutral-900 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header Controls & Progress Bar */}
          <div className="absolute top-0 left-0 right-0 z-40 bg-linear-to-b from-black/80 via-black/40 to-transparent pb-4">
            <WrappedProgress
              totalStories={totalScreens}
              currentIndex={currentStoryIndex}
              progressPercent={100}
            />

            <div className="flex items-center justify-between px-5 pt-1">
              <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                BRIDGE RECAP
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>

          {/* Tap Zones for Story Navigation */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-0 w-1/3 z-20 cursor-pointer"
            title="Previous"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-0 w-2/3 z-20 cursor-pointer"
            title="Next"
          />

          {/* Story Viewport */}
          <div className="flex-1 w-full h-full pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStoryIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                {renderStoryScreen()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop Chevron Navigation Overlay */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 absolute bottom-2 left-0 right-0 z-30 pointer-events-none">
            {currentStoryIndex > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="pointer-events-auto p-2 rounded-full bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <FaChevronLeft size={12} />
              </button>
            ) : <div />}
            {currentStoryIndex < totalScreens - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="pointer-events-auto p-2 rounded-full bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <FaChevronRight size={12} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}