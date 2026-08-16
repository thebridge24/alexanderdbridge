// components/devotional/StreakMiniCalendar.tsx
"use client";

import { useState } from "react";
import { AttendanceRecord } from "@/lib/types/streak";
import { IoCheckmark, IoChevronBack, IoChevronForward } from "react-icons/io5";

interface Props {
  attendanceHistory: Record<string, AttendanceRecord>;
}

export default function StreakMiniCalendar({ attendanceHistory }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Name of current displayed month
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate days in month & starting day offset
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonthDate = new Date(year, month + 1, 1);
    if (nextMonthDate <= new Date(today.getFullYear(), today.getMonth() + 1, 1)) {
      setCurrentDate(nextMonthDate);
    }
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-4">
      {/* Header Month Switcher */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all active:scale-90"
          aria-label="Previous Month"
        >
          <IoChevronBack className="w-4 h-4" />
        </button>

        <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
          {monthName}
        </h4>

        <button
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
          className={`p-1.5 rounded-full border transition-all active:scale-90 ${
            isCurrentMonth
              ? "opacity-30 border-transparent text-neutral-600 cursor-not-allowed"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
          }`}
          aria-label="Next Month"
        >
          <IoChevronForward className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Indicators */}
      <div className="flex items-center justify-end gap-3 text-[10px] font-medium text-neutral-400 mb-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ff0000]" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-700" /> Missed
        </span>
      </div>

      {/* Day Labels Row (Sun-Sat) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayLabels.map((label, idx) => (
          <span key={idx} className="text-[10px] font-bold text-neutral-500 uppercase">
            {label}
          </span>
        ))}
      </div>

      {/* Month Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Empty Padding Cells for Offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8 mx-auto" />
        ))}

        {/* Month Day Cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

          const record = attendanceHistory[dateStr];
          const isCompleted = record?.completed;

          const isFuture = dateStr > todayStr;
          const isToday = dateStr === todayStr;

          return (
            <div key={dateStr} className="flex flex-col items-center justify-center my-0.5">
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
                    : "bg-neutral-900/50 text-neutral-500 border border-neutral-800/50"
                }`}
              >
                {isCompleted ? <IoCheckmark className="w-4 h-4 stroke-3" /> : dayNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}