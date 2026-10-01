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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [isExpanded, setIsExpanded] = useState(false);
  const [direction, setDirection] = useState<number>(0); // -1 for left/prev, 1 for right/next

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  // Helper to generate a 7-day week slice based on an offset
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

  // Month boundary calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    setDirection(-1);
    if (isExpanded) {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      setWeekOffset((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (isExpanded) {
      if (!isCurrentMonth) {
        setDirection(1);
        setCurrentDate(new Date(year, month + 1, 1));
      }
    } else {
      if (weekOffset < 0) {
        setDirection(1);
        setWeekOffset((prev) => prev + 1);
      }
    }
  };

  // Handle Framer Motion Drag End Gesture (Smooth direct swipe)
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold || info.velocity.x > 300) {
      // Swiped Right -> Go to Previous Week/Month
      handlePrev();
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -300) {
      // Swiped Left -> Go to Next Week/Month
      handleNext();
    }
  };

  const currentDisplayDate = !isExpanded
    ? getWeekDaysForOffset(weekOffset)[0]
    : currentDate;

  const monthName = currentDisplayDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-4 shadow-xl backdrop-blur-sm transition-all overflow-hidden select-none">
      {/* Month Navigation Row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono">
          {monthName}
        </h4>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-90 cursor-pointer"
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
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
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
              setDirection(0);
            }}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#ff0000] bg-[#ff0000]/10 border border-[#ff0000]/30 px-2.5 py-1 rounded-full hover:bg-[#ff0000]/20 transition-all ml-1 cursor-pointer"
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

      {/* Touch/Mouse Interactive Swipe Container */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="w-full cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <AnimatePresence mode="wait" custom={direction}>
          {!isExpanded ? (
            /* --- Horizontal Week View --- */
            <motion.div
              key={`week-${weekOffset}`}
              initial={{ x: direction * 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="flex items-center justify-between gap-1 py-1 w-full"
            >
              {getWeekDaysForOffset(weekOffset).map((dateObj, idx) => {
                const dateStr = `${dateObj.getFullYear()}-${String(
                  dateObj.getMonth() + 1
                ).padStart(2, "0")}-${String(dateObj.getDate()).padStart(
                  2,
                  "0"
                )}`;

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
            /* --- Expanded Month Grid View --- */
            <motion.div
              key={`month-${year}-${month}`}
              initial={{ x: direction * 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="space-y-2 pt-1 w-full"
            >
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
                {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map(
                  (_, i) => (
                    <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
                  )
                )}

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
      </motion.div>

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
