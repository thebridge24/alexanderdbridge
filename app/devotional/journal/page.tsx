
"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LuNotebookPen } from "react-icons/lu";
import { HiHeart } from "react-icons/hi";

const JOURNAL_CONTENT = {
  eyebrow: "A New Chapter Awaits",
  title: "Your Personal Journal",
  description:
    "Something special is coming! Soon, you'll be able to write down your thoughts, reflect on God's Word, record your prayers, and keep track of what He is doing in your life.",
  cta: "Support Bridge Daily",
  href: "/support",
};

export default function JournalComingSoon() {
  return (
    <div className="min-h-[85vh] bg-black text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Ambient Red Glow */}
      <div className="absolute size-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md mx-auto text-center space-y-8 relative z-10">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center mx-auto">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="size-28 rounded-full backdrop-blur-xl flex items-center justify-center relative"
          >
            <LuNotebookPen className="size-20 text-primary" />
          </motion.div>
        </div>

        {/* Content Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-3"
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-primary font-bold inline-block">
            {JOURNAL_CONTENT.eyebrow}
          </span>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {JOURNAL_CONTENT.title}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
            {JOURNAL_CONTENT.description}
          </p>
        </motion.div>

        {/* Support Call-to-Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href={JOURNAL_CONTENT.href}
            className="w-full py-3.5 px-4 rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <HiHeart className="size-4 fill-current" />
            <span>{JOURNAL_CONTENT.cta}</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
