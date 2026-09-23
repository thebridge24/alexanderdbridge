"use client";

import { useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  // Formatting strings
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate Month Boundaries
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(year, month + 1, 1);
    if (
      nextMonthDate <= new Date(today.getFullYear(), today.getMonth() + 1, 1)
    ) {
      setCurrentDate(nextMonthDate);
    }
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  // Helper to generate current 7-day week slice (Monday -> Sunday)
  const getCurrentWeekDays = () => {
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const currentWeekDays = getCurrentWeekDays();

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 shadow-xl backdrop-blur-sm transition-all">
      {/* Month Navigation Row (Shown mainly when expanded or for context) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
          {monthName}
        </h4>

        <div className="flex items-center gap-1.5">
          {isExpanded && (
            <>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-90"
                aria-label="Previous Month"
              >
                <IoChevronBack className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                disabled={isCurrentMonth}
                className={`p-1 rounded-full border transition-all active:scale-90 ${
                  isCurrentMonth
                    ? "opacity-30 border-transparent text-neutral-600 cursor-not-allowed"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
                aria-label="Next Month"
              >
                <IoChevronForward className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Toggle Expand/Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
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

      {/* Main Dynamic View Area */}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* --- Dynamic Horizontal 7-Day Strip View (Matching UI Design) --- */
          <motion.div
            key="horizontal-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between gap-1 py-1"
          >
            {currentWeekDays.map((dateObj, idx) => {
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
          </motion.div>
        ) : (
          /* --- Expanded Full Month Grid View --- */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-1"
          >
            {/* Day Labels Row */}
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

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty offset padding */}
              {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
              ))}

              {/* Day Cells */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Indicator Legend */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-medium text-neutral-400 mt-3 pt-2 border-t border-neutral-800/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff0000]" />{" "}
          Completed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-700" /> Missed
        </span>
      </div>
    </div>
  );
}