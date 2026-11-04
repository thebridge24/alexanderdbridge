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
  authorImage = "https://res.cloudinary.com/annnyure/image/upload/v1792054361/20250129_130645.png",
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

  const isLastParagraph = currentIndex === paragraphs.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Main Overlay Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-sm bg-black border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/20 flex flex-col p-6 sm:p-7"
        >
          {/* Subtle Red & Neutral Gradient Glows (Top Left & Right Blur Accents) */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-neutral-700/20 rounded-full blur-2xl pointer-events-none" />

          {/* Header Row: Pagination Indicators & Conditional Close Button */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            {/* Pagination Indicators */}
            <div className="flex items-center gap-1.5">
              {paragraphs.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-red-600"
                      : "w-1.5 bg-neutral-800"
                  }`}
                />
              ))}
            </div>

            {/* Cancel / Close Button - Visible ONLY on the last paragraph */}
            {isLastParagraph && (
              <button
                onClick={handleDismiss}
                aria-label="Close message"
                className="p-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Title */}
          <div className="relative z-10 mb-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              {title}
            </h2>
          </div>

          {/* Draggable / Swipable Paragraph Slide Container */}
          <div className="relative z-10 mb-6">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="min-h-20 flex items-center cursor-grab active:cursor-grabbing overflow-hidden"
            >
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentIndex}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="text-neutral-300 text-xs sm:text-sm leading-relaxed w-full select-none"
                >
                  {paragraphs[currentIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Tiny instruction under the paragraph */}
            <p className="text-[10px] font-mono text-neutral-500 mt-2 select-none">
              Swipe to next or click red button
            </p>
          </div>

          {/* Footer: Small Author Circle Profile & Next Button */}
          <div className="pt-4 border-t border-neutral-900 flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Small Circle Author Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                <img
                  src={authorImage}
                  alt={authorName}
                  className="w-full h-full object-cover object-top"
                />
              </div>

              {/* Author Name and Title */}
              <div className="min-w-0 text-left">
                <h3 className="text-xs font-bold text-white truncate">
                  {authorName}
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono truncate">
                  {authorRole}
                </p>
              </div>
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="p-2.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-full shadow-md shadow-red-950/40 transition-all cursor-pointer flex items-center justify-center shrink-0"
            >
              <ChevronRight strokeWidth={2.5} className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};