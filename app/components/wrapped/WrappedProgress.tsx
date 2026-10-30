"use client";

import React from "react";

interface WrappedProgressProps {
  totalStories: number;
  currentIndex: number;
  progressPercent: number; // 0 to 100 for current story
}

export function WrappedProgress({
  totalStories,
  currentIndex,
  progressPercent,
}: WrappedProgressProps) {
  return (
    <div className="flex items-center gap-1.5 w-full px-4 pt-4 pb-2 z-30">
      {Array.from({ length: totalStories }).map((_, idx) => {
        let width = "0%";
        if (idx < currentIndex) {
          width = "100%";
        } else if (idx === currentIndex) {
          width = `${progressPercent}%`;
        }

        return (
          <div
            key={idx}
            className="h-1 flex-1 bg-neutral-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width }}
            />
          </div>
        );
      })}
    </div>
  );
}