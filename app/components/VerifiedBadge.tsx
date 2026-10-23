/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { MdVerified } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import {
  VerificationTier,
  VERIFICATION_TIERS,
  getUserVerificationTier,
} from "@/lib/utils/verification";

interface VerifiedBadgeProps {
  tier?: VerificationTier | string | null;
  name?: string | null;
  email?: string | null;
  metadata?: Record<string, any> | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_MAP = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  tier,
  name,
  email,
  metadata,
  className = "",
  size = "sm",
  showLabel = false,
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [isLabelVisible, setIsLabelVisible] = useState(false);

  // Resolve effective tier
  let resolvedTier: VerificationTier | null = null;

  if (tier && typeof tier === "string") {
    const clean = tier.toLowerCase() as VerificationTier;
    if (clean in VERIFICATION_TIERS) {
      resolvedTier = clean;
    }
  }

  if (!resolvedTier) {
    resolvedTier = getUserVerificationTier({ name, email, metadata });
  }

  if (!resolvedTier) return null;

  const info = VERIFICATION_TIERS[resolvedTier];
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.sm;

  // Periodic Glass Sweep & Label Slide Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Trigger wider light sweep across everything
      setIsSweeping(true);
      setTimeout(() => setIsSweeping(false), 1000); // 1000ms sweep duration

      // Optionally slide out label if showLabel is enabled
      if (showLabel) {
        setIsLabelVisible(true);
        setTimeout(() => {
          setIsLabelVisible(false);
        }, 5000); // Display label for 5 seconds then hide
      }
    }, 7000); // Triggers every 7 seconds randomly

    return () => clearInterval(interval);
  }, [showLabel]);

  return (
    <span
      className={`relative inline-flex items-center gap-1 shrink-0 overflow-hidden rounded-full px-0.5 py-0.5 ${info.textColorClass} ${className}`}
      title={`Verified ${info.label}`}
    >
      {/* Icon */}
      <div className="relative inline-flex items-center justify-center shrink-0">
        <MdVerified className={`${sizeClass} relative z-10`} />
      </div>

      {/* Sliding Label (grows from w-0) */}
      {showLabel && (
        <AnimatePresence>
          {(isLabelVisible || !showLabel) && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden whitespace-nowrap inline-flex items-center shrink-0"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider pl-0.5">
                {info.label}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      )}

      {/* Continuous Light Sweep Effect Overlay spanning the whole badge */}
      <AnimatePresence>
        {isSweeping && (
          <motion.span
            initial={{ x: "-120%", opacity: 0 }}
            animate={{
              x: ["220%", "-120%"],
              opacity: [0.85, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: "easeInOut",
              times: [0, 1],
            }}
            className="absolute inset-y-0 w-3/4 bg-linear-to-r from-transparent via-white/90 to-transparent skew-x-12 z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </span>
  );
};

export default VerifiedBadge;
