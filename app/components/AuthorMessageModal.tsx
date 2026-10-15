/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronRight, X } from "lucide-react";

export interface AuthorMessageModalProps {
  /** Unique ID for the message. Changing this forces the modal to show again for users. */
  messageId: string;
  /** Title of the message */
  title: string;
  /** Array of paragraphs to render sequentially as slides */
  paragraphs: string[];
  /** URL to the author avatar image */
  authorImage?: string;
  /** Author name */
  authorName?: string;
  /** Author title/role */
  authorRole?: string;
  /** Delay in milliseconds before the popup appears */
  delayMs?: number;
  /** Optional callback fired when the modal is dismissed */
  onClose?: () => void;
}

export const AuthorMessageModal: React.FC<AuthorMessageModalProps> = ({
  messageId,
  title,
  paragraphs = [],
  authorImage = "https://res.cloudinary.com/glqzvvh2/image/upload/v1792043676/CHI_5085_bckskx.jpg",
  authorName = "Alexander D' Bridge",
  authorRole = "Author of Bridge Daily",
  delayMs = 1500,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const storageKey = `author_msg_read_${messageId}`;
    const hasSeenMessage = localStorage.getItem(storageKey);

    if (!hasSeenMessage) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [messageId, delayMs]);

  const handleDismiss = () => {
    localStorage.setItem(`author_msg_read_${messageId}`, "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentIndex < paragraphs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  // Swipe gesture handler
  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      // Swiped left -> Next slide
      handleNext();
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      // Swiped right -> Previous slide
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!isVisible || paragraphs.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-6 bg-black/85 backdrop-blur-md">
        {/* Main Overlay Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-md bg-black border border-neutral-800 rounded-4xl overflow-hidden shadow-2xl shadow-red-950/25 flex flex-col"
        >
          {/* Top Close Button */}
          <button
            onClick={handleDismiss}
            aria-label="Close message"
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Circular Avatar Hero Section */}
          <div className="relative pb-4 flex justify-center max-h-72">
            <img
              src={authorImage}
              alt={authorName}
              className="w-full h-full object-cover object-top -mt-16 pointer-events-none"
            />
          </div>

          {/* Overlapping Glass Content Card */}
          <div className="relative -mt-6 bg-black/75 backdrop-blur-md border-t border-neutral-800/80 rounded-tl-[56px] p-6 sm:p-7 flex flex-col justify-between space-y-5">
            {/* Pagination & Message Header */}
            <div className="space-y-3">
              {/* Pagination Indicators (Active is wider) */}
              <div className="flex items-center gap-1.5">
                {paragraphs.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentIndex
                        ? "w-7 bg-red-500"
                        : "w-2 bg-neutral-800"
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                {title}
              </h2>
            </div>

            {/* Draggable / Swipable Paragraph Slide Container */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="min-h-[110px] flex items-center cursor-grab active:cursor-grabbing overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-neutral-300 text-xs sm:text-sm leading-relaxed w-full select-none"
                >
                  {paragraphs[currentIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Footer Author Branding & Action Button */}
            <div className="pt-4 border-t border-neutral-800/80 flex flex-row items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {authorName}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {authorRole}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next paragraph slide"
                className="p-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-medium text-xs rounded-full shadow-lg shadow-red-950/40 transition-all duration-150 cursor-pointer flex items-center justify-center"
              >
                <ChevronRight strokeWidth={3} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
