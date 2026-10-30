"use client";

import { useState } from "react";
import { BridgeWrapped, BridgeWrappedProps } from "./BridgeWrapped";

export function WrappedTrigger({
  userId,
  currentDate,
  forceShow = false,
}: Omit<BridgeWrappedProps, "onClose">) {
  const [isOpen, setIsOpen] = useState(false);

  // Check if current date is the last calendar day of the month
  const targetDate = currentDate ? new Date(currentDate) : new Date();
  const lastDayOfMonth = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth() + 1, 0));
  const isLastDay = targetDate.getDate() === lastDayOfMonth.getDate();

  // Show trigger if forceShow is enabled or if today is the end of the month
  if (!forceShow && !isLastDay) {
    return null;
  }

  return (
    <>
      <div className="my-8 flex flex-col items-center justify-center text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-950/40 border border-red-500/30 transition-all transform active:scale-95 cursor-pointer"
        >
          {/* <FaSparkles className="size-4 text-white animate-spin-slow" /> */}
          <span>Play Your Monthly Wrapped</span>
        </button>
        <p className="text-[11px] font-mono text-neutral-500 mt-2">
          A personalized storytelling recap of your spiritual journey this month.
        </p>
      </div>

      {isOpen && (
        <BridgeWrapped
          userId={userId}
          currentDate={currentDate}
          forceShow={forceShow}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}