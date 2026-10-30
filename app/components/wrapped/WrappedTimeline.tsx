"use client";

import { motion } from "framer-motion";
import { FaCheck  } from "react-icons/fa";

interface DevotionalItem {
  id: string;
  date: string;
  dayNumber: number;
  title: string;
  excerpt: string;
  completed: boolean;
}

interface WrappedTimelineProps {
  devotionals: DevotionalItem[];
  pageIndex: number;
  totalPages: number;
  monthName: string;
}

export function WrappedTimeline({
  devotionals,
  pageIndex,
  totalPages,
  monthName,
}: WrappedTimelineProps) {
  return (
    <div className="h-full flex flex-col justify-between p-6 sm:p-8 text-left bg-black select-none overflow-y-auto">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase">
            DEVOTIONAL JOURNEY ({pageIndex + 1}/{totalPages})
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            {monthName} Timeline
          </h2>
        </div>
      </div>

      <div className="space-y-4 my-auto py-4 relative">
        {/* Vertical timeline connector line */}
        <div className="absolute left-4.75 top-6 bottom-6 w-0.5 bg-neutral-800 z-0" />

        {devotionals.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="flex items-start gap-4 relative z-10"
          >
            {/* Circular Date Indicator */}
            <div
              className={`size-10 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-lg border ${
                item.completed
                  ? "bg-red-600 text-white border-red-500 shadow-red-950/50"
                  : "bg-neutral-900 text-neutral-500 border-neutral-800"
              }`}
            >
              {item.dayNumber}
            </div>

            {/* Content card */}
            <div className="flex-1 p-3.5 rounded-2xl bg-neutral-900/50 border border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                  {item.title}
                </h3>
                {item.completed ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/40 shrink-0">
                    <FaCheck size={9} /> Read
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800 shrink-0">
                    Missed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 line-clamp-1 leading-normal">
                {item.excerpt}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center pb-2">
        <p className="text-[10px] font-mono text-neutral-500">
          Page {pageIndex + 1} of {totalPages}
        </p>
      </div>
    </div>
  );
}