"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X } from "lucide-react";

export interface AuthorMessageModalProps {
  /** Unique ID for the message. Changing this forces the modal to show again for users. */
  messageId: string;
  /** Title of the message */
  title: string;
  /** Array of paragraphs to render sequentially */
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
  paragraphs,
  authorImage = "/author-avatar.jpg",
  authorName = "Alexander D. Bridge",
  authorRole = "Founder & Author of Bridge Daily Devotional",
  delayMs = 1500,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // Check if user has already read this specific message version
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
    // Save to localStorage so it is read only once for this messageId
    localStorage.setItem(`author_msg_read_${messageId}`, "true");
    setIsVisible(false);
    if (onClose) onClose();
  };

  // Staggered container for paragraphs explicitly typed with Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.6,
        delayChildren: 0.3,
      },
    },
  };

  // Paragraph opacity transition animation explicitly typed with Variants
  const paragraphVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.1, 0.25, 1.0] as const, // Strict tuple typing for cubic-bezier ease
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          {/* Main Overlay Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl shadow-red-950/20 flex flex-col"
          >
            {/* Top Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Close message"
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Circular Avatar Hero Section */}
            <div className="relative pt-8 pb-4 flex justify-center bg-gradient-to-b from-red-950/20 to-transparent">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-red-600 via-neutral-800 to-neutral-900 shadow-xl">
                <img
                  src={authorImage}
                  alt={authorName}
                  className="w-full h-full object-cover rounded-full border-2 border-neutral-950"
                />
              </div>
            </div>

            {/* Overlapping Glass Content Card */}
            <div className="relative -mt-6 bg-neutral-900/90 border-t border-neutral-800/80 rounded-t-3xl p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
              
              {/* Message Header */}
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded-full inline-block">
                  A Word from the Author
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug pt-2">
                  {title}
                </h2>
              </div>

              {/* Animated Paragraphs Section */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-3.5 text-neutral-300 text-xs sm:text-sm leading-relaxed max-h-[38vh] overflow-y-auto pr-1 custom-scrollbar"
              >
                {paragraphs.map((paragraph, idx) => (
                  <motion.p key={idx} variants={paragraphVariants}>
                    {paragraph}
                  </motion.p>
                ))}
              </motion.div>

              {/* Footer Author Branding & Action */}
              <div className="pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {authorName}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {authorRole}
                  </p>
                </div>

                <button
                  onClick={handleDismiss}
                  className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-red-950/40 transition-all"
                >
                  Got it, thank you
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
