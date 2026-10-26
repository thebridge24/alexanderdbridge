"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiUsers, HiHeart } from "react-icons/hi";

export default function CommunityComingSoon() {
  return (
    <div className="min-h-[85vh] bg-black text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background Ambient Red Glow */}
      <div className="absolute size-96 rounded-full bg-red-600/10 blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md mx-auto text-center space-y-8 relative z-10">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center mx-auto">
          {/* Core Red Icon Badge */}
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
            <HiUsers className="size-24 text-primary" />
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
            Anticipate Something Big
          </span>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Community Space
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
            Something beautiful is coming! Soon, you&apos;ll be able to share what
            God is doing in your life, post prayer requests, and connect with
            others as we grow together in faith.
          </p>
        </motion.div>

        {/* Support Call-to-Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className=""
        >
          <Link
            href="/support"
            className="w-full py-3.5 px-4 rounded-full bg-red-600 hover:bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
          >
            <HiHeart className="size-4 fill-current" />
            <span>Support Bridge Daily</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
