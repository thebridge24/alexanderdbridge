"use client";

import React from "react";
import { MdVerified } from "react-icons/md";
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

  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 ${info.textColorClass} ${className}`}
      title={`Verified ${info.label}`}
    >
      <MdVerified className={sizeClass} />
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {info.label}
        </span>
      )}
    </span>
  );
};

export default VerifiedBadge;
