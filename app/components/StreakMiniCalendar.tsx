"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AttendanceRecord } from "@/lib/types/streak";
import {
  IoCheckmark,
  IoChevronBack,
  IoChevronForward,
  IoChevronDown,
  IoChevronUp,
} from "react-icons/io5";

interface Props {
  attendanceHistory: Record<string, AttendanceRecord>;
}

export default function StreakMiniCalendar({ attendanceHistory }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [isExpanded, setIsExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isAdjustingScroll = useRef(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  // Helper to generate a 7-day week slice based on an arbitrary week offset
  const getWeekDaysForOffset = (offset: number) => {
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + offset * 7);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  // Helper to compute Month parameters given a Date object
  const getMonthDetails = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = dateObj.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    return { year, month, firstDay, daysInMonth, monthName };
  };

  const currentMonthDetails = getMonthDetails(currentDate);
  const prevMonthDetails = getMonthDetails(
    new Date(currentMonthDetails.year, currentMonthDetails.month - 1, 1)
  );
  const nextMonthDetails = getMonthDetails(
    new Date(currentMonthDetails.year, currentMonthDetails.month + 1, 1)
  );

  const isCurrentMonth =
    currentMonthDetails.year === today.getFullYear() &&
    currentMonthDetails.month === today.getMonth();

  // Navigation Handlers
  const handlePrev = () => {
    if (isExpanded) {
      setCurrentDate(
        new Date(currentMonthDetails.year, currentMonthDetails.month - 1, 1)
      );
    } else {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (isExpanded) {
      if (!isCurrentMonth) {
        setCurrentDate(
          new Date(currentMonthDetails.year, currentMonthDetails.month + 1, 1)
        );
      }
    } else {
      if (weekOffset < 0) {
        setWeekOffset((prev) => prev + 1);
      }
    }
  };

  // Center scroll container on mount / state change
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      isAdjustingScroll.current = true;
      el.scrollLeft = el.clientWidth; // Center view on index 1
      setTimeout(() => {
        isAdjustingScroll.current = false;
      }, 50);
    }
  }, [isExpanded, currentDate, weekOffset]);

  // Handle continuous horizontal scroll snapping without buffer text
  const handleScroll = () => {
    if (!containerRef.current || isAdjustingScroll.current) return;

    const el = containerRef.current;
    const width = el.clientWidth;

    // Scrolled to Previous Panel (Index 0)
    if (el.scrollLeft <= 5) {
      isAdjustingScroll.current = true;
      handlePrev();
      el.scrollLeft = width;
      setTimeout(() => {
        isAdjustingScroll.current = false;
      }, 50);
    }
    // Scrolled to Next Panel (Index 2)
    else if (el.scrollLeft >= width * 2 - 5) {
      if (isExpanded && isCurrentMonth) {
        el.scrollLeft = width; // Lock scroll at current month boundary
        return;
      }
      if (!isExpanded && weekOffset >= 0) {
        el.scrollLeft = width; // Lock scroll at current week boundary
        return;
      }

      isAdjustingScroll.current = true;
      handleNext();
      el.scrollLeft = width;
      setTimeout(() => {
        isAdjustingScroll.current = false;
      }, 50);
    }
  };

  // Render a 7-Day Horizontal Week Strip
  const renderWeekStrip = (offset: number) => {
    const days = getWeekDaysForOffset(offset);

    return (
      <div className="flex items-center justify-between gap-1 py-1 w-full">
        {days.map((dateObj, idx) => {
          const dateStr = `${dateObj.getFullYear()}-${String(
            dateObj.getMonth() + 1
          ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

          const record = attendanceHistory[dateStr];
          const isCompleted = record?.completed;
          const isToday = dateStr === todayStr;
          const isFuture = dateStr > todayStr;
          const dayNum = dateObj.getDate();

          return (
            <div
              key={dateStr}
              className="flex flex-col items-center gap-2 flex-1 min-w-0"
            >
              <span className="text-[10px] font-bold text-neutral-500 uppercase">
                {dayLabels[idx]}
              </span>

              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-[#ff0000] text-white shadow-[0_0_12px_rgba(255,0,0,0.4)]"
                    : isToday
                    ? "bg-neutral-950 border-2 border-[#ff0000] text-white"
                    : !isCompleted && record
                    ? "bg-neutral-800 text-neutral-500 line-through"
                    : isFuture
                    ? "bg-neutral-950 text-neutral-600 border border-neutral-900"
                    : "bg-black text-neutral-500 border border-neutral-800/50"
                }`}
              >
                {isCompleted ? (
                  <IoCheckmark className="w-4 h-4 stroke-3 text-white" />
                ) : (
                  dayNum
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render a Full Month Grid
  const renderMonthGrid = (monthInfo: ReturnType<typeof getMonthDetails>) => {
    const { year, month, firstDay, daysInMonth } = monthInfo;

    return (
      <div className="space-y-2 pt-1 w-full">
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayLabels.map((label, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold text-neutral-500 uppercase"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: (firstDay + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(
              2,
              "0"
            )}-${String(dayNum).padStart(2, "0")}`;

            const record = attendanceHistory[dateStr];
            const isCompleted = record?.completed;
            const isFuture = dateStr > todayStr;
            const isToday = dateStr === todayStr;

            return (
              <div
                key={dateStr}
                className="flex flex-col items-center justify-center my-0.5"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-[#ff0000] text-white shadow-[0_0_10px_rgba(255,0,0,0.3)]"
                      : isToday
                      ? "bg-neutral-900 border-2 border-[#ff0000] text-white"
                      : !isCompleted && record
                      ? "bg-neutral-800 text-neutral-500 line-through"
                      : isFuture
                      ? "bg-neutral-950 text-neutral-600 border border-neutral-900"
                      : "bg-black text-neutral-500 border border-neutral-800/50"
                  }`}
                >
                  {isCompleted ? (
                    <IoCheckmark className="w-3.5 h-3.5 stroke-3 text-white" />
                  ) : (
                    dayNum
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const currentDisplayDate = !isExpanded
    ? getWeekDaysForOffset(weekOffset)[0]
    : currentDate;

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 shadow-xl backdrop-blur-sm transition-all">
      {/* Month Navigation Row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
          {currentDisplayDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h4>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-90"
            aria-label="Previous"
          >
            <IoChevronBack className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isExpanded ? isCurrentMonth : weekOffset >= 0}
            className={`p-1 rounded-full border transition-all active:scale-90 ${
              (isExpanded ? isCurrentMonth : weekOffset >= 0)
                ? "opacity-30 border-transparent text-neutral-600 cursor-not-allowed"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
            aria-label="Next"
          >
            <IoChevronForward className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(!isExpanded);
              setWeekOffset(0);
            }}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#ff0000] bg-[#ff0000]/10 border border-[#ff0000]/30 px-2.5 py-1 rounded-full hover:bg-[#ff0000]/20 transition-all ml-1"
          >
            {isExpanded ? (
              <>
                Collapse <IoChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                Full Month <IoChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Seamless Virtualized Horizontal Feed Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Index 0: Render Previous Week / Month */}
        <div className="min-w-full snap-center shrink-0 pr-2">
          {!isExpanded
            ? renderWeekStrip(weekOffset - 1)
            : renderMonthGrid(prevMonthDetails)}
        </div>

        {/* Index 1: Render Current Active Week / Month */}
        <div className="min-w-full snap-center shrink-0 px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                !isExpanded
                  ? `week-${weekOffset}`
                  : `month-${currentMonthDetails.year}-${currentMonthDetails.month}`
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {!isExpanded
                ? renderWeekStrip(weekOffset)
                : renderMonthGrid(currentMonthDetails)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Index 2: Render Next Week / Month */}
        <div className="min-w-full snap-center shrink-0 pl-2">
          {!isExpanded
            ? renderWeekStrip(weekOffset + 1)
            : renderMonthGrid(nextMonthDetails)}
        </div>
      </div>

      {/* Footer Indicator Legend */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-medium text-neutral-400 mt-3 pt-2 border-t border-neutral-800/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff0000]" /> Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-700" /> Missed
        </span>
      </div>
    </div>
  );
}
