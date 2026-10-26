
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoEyeOutline } from "react-icons/io5";
import { FaFire } from "react-icons/fa6";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { MILESTONE_MEDALS } from "@/lib/types/streak";
import {
  UserProfileData,
  UserProfilePopup,
} from "./ui/UserProfilePopup";
import { Visitor } from "../types/visitors";

interface DailyVisitorsProps {
  devotionalDate: string;
}

// Helper: select the highest earned streak medal.
function renderStreakMedalIcon(streak: number) {
  const sortedMedals = [...MILESTONE_MEDALS].sort(
    (a, b) => b.targetDays - a.targetDays,
  );

  const earnedMedal = sortedMedals.find(
    (medal) => streak >= medal.targetDays,
  );

  const IconComponent = earnedMedal?.icon ?? FaFire;
  const label = earnedMedal?.name ?? "Streak";

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 text-white drop-shadow-sm"
      title={`${label} (${streak} days)`}
    >
      <IconComponent className="size-2 text-white/80" />
    </span>
  );
}

// Helper: format visitor timestamps.
function formatVisitTime(iso: string) {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "";

  const diff = Math.floor(
    (Date.now() - date.getTime()) / 1000,
  );

  if (diff < 0) return "Just now";
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Visitor row. Clicking it opens that visitor's profile.
function VisitorAvatar({
  visitor,
  onSelect,
}: {
  visitor: Visitor;
  onSelect: (visitor: Visitor) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const name = visitor.display_name || "Believer";
  const initial = name.charAt(0).toUpperCase();
  const streakCount = visitor.streakCount || 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(visitor)}
      className="w-full flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0 text-left hover:bg-white/5 rounded-xl px-1 transition-colors cursor-pointer"
      aria-label={`View ${name}'s profile`}
    >
      <div className="size-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
        {visitor.avatar_url && !imgError ? (
          <img
            src={visitor.avatar_url}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-xs font-bold text-neutral-300">
            {initial}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <p className="text-xs font-semibold text-neutral-200 truncate">
            {name}
          </p>

          <VerifiedBadge
            tier={visitor.verification_tier}
            name={name}
            size="xs"
          />

          {streakCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-300">
              {renderStreakMedalIcon(streakCount)}
              <span className="text-orange-400">{streakCount}</span>
            </span>
          )}
        </div>

        <p className="text-[10px] text-neutral-500">
          {formatVisitTime(visitor.visited_at)}
        </p>
      </div>
    </button>
  );
}

// Small avatars displayed in the trigger.
function StackedAvatar({ visitor }: { visitor: Visitor }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="size-7 rounded-full overflow-hidden border-2 border-black bg-neutral-800 shrink-0">
      {visitor.avatar_url && !imgError ? (
        <img
          src={visitor.avatar_url}
          alt={visitor.display_name || "Visitor"}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="size-full flex items-center justify-center text-[9px] font-bold text-neutral-300">
          {visitor.display_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}

export default function DailyVisitors({
  devotionalDate,
}: DailyVisitorsProps) {
  // State
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVisitor, setSelectedVisitor] =
    useState<Visitor | null>(null);

  // Fetch devotional visitors.
  useEffect(() => {
    if (!devotionalDate) {
      setVisitors([]);
      return;
    }

    const controller = new AbortController();

    async function fetchVisitors() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/devotionals/${devotionalDate}/visitors`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch visitors");
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setVisitors(data.visitors || []);
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.name !== "AbortError"
        ) {
          console.error("Failed to load visitors:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchVisitors();

    return () => controller.abort();
  }, [devotionalDate]);

  // Build the profile from the visitor currently selected.
  const profileData: UserProfileData | null = selectedVisitor
    ? {
        id: selectedVisitor.user_id || selectedVisitor.id,
        name: selectedVisitor.display_name || "Believer",
        email: selectedVisitor.email,
        avatarUrl: selectedVisitor.avatar_url,
        bannerUrl: selectedVisitor.banner_url,
        bio: selectedVisitor.bio,
        verificationTier: selectedVisitor.verification_tier,
        currentStreak: selectedVisitor.streakCount || 0,
        mutualFriends: selectedVisitor.mutual_friends || [],
      }
    : null;

  // Open the selected visitor's profile.
  const handleVisitorSelect = (visitor: Visitor) => {
    setIsOpen(false);
    setSelectedVisitor(visitor);
  };

  // Close the profile popup.
  const handleProfileClose = () => {
    setSelectedVisitor(null);
  };

  if (visitors.length === 0 && !loading) return null;

  return (
    <div className="relative">
      {/* Stacked Avatar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex items-center gap-2 group cursor-pointer"
        aria-label="Show today's visitors"
        aria-expanded={isOpen}
      >
        <div className="flex -space-x-2">
          {visitors.slice(0, 5).map((visitor) => (
            <StackedAvatar
              key={visitor.id}
              visitor={visitor}
            />
          ))}

          {visitors.length > 5 && (
            <div className="flex items-center justify-center text-xs font-bold text-neutral-300 ml-3">
              +{visitors.length - 5} others
            </div>
          )}
        </div>

        {loading && visitors.length === 0 && (
          <span className="text-xs text-neutral-500">
            Loading visitors...
          </span>
        )}
      </button>

      {/* Slide-down Visitors Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 28,
            }}
            className="absolute left-0 mt-3 w-72 max-w-[calc(100vw-2rem)] rounded-3xl bg-neutral-950/95 border border-neutral-800 backdrop-blur-2xl p-4 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IoEyeOutline className="size-3.5 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  {visitors.length}{" "}
                  {visitors.length === 1 ? "view" : "views"} Today
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                aria-label="Close visitors list"
              >
                <IoClose className="size-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto no-scrollbar">
              {visitors.map((visitor) => (
                <VisitorAvatar
                  key={visitor.id}
                  visitor={visitor}
                  onSelect={handleVisitorSelect}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Visitor Profile Popup */}
      {profileData && (
        <UserProfilePopup
          isOpen={Boolean(selectedVisitor)}
          onClose={handleProfileClose}
          user={profileData}
          onToggleFollow={(userId) => {
            // Connect your follow/unfollow API here.
            console.log("Toggled follow for:", userId);
          }}
          onMessage={(userId) => {
            // Connect your messaging route or conversation API here.
            console.log("Open message thread with:", userId);
          }}
        />
      )}
    </div>
  );
}
