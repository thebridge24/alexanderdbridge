"use client";

import React from "react";
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
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

/**
 * Twitter/X scalloped style SVG badge.
 */
function ScallopedVerifiedIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-label="Verified Badge"
      className={className}
      fill="currentColor"
    >
      <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.21.46-1.39.2-2.97-.8-4.08s-2.69-1.26-4.08-.8C14.64 2.6 13.4 1.72 11.97 1.72s-2.67.88-3.21 2.19c-1.39-.46-2.97-.2-4.08.8s-1.26 2.69-.8 4.08C2.6 9.33 1.72 10.57 1.72 12s.88 2.67 2.19 3.21c-.46 1.39-.2 2.97.8 4.08s2.69 1.26 4.08.8c.54 1.31 1.78 2.19 3.21 2.19s2.67-.88 3.21-2.19c1.39.46 2.97.2 4.08-.8s1.26-2.69.8-4.08c1.31-.54 2.19-1.78 2.19-3.21zm-11.4 4.5l-4.2-4.2 1.41-1.41 2.79 2.79 6.59-6.59 1.41 1.41-8 8z" />
    </svg>
  );
}

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
      <ScallopedVerifiedIcon className={sizeClass} />
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {info.label}
        </span>
      )}
    </span>
  );
};

export default VerifiedBadge;
