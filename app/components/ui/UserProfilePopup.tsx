/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import {
  FaFire,
  FaUserPlus,
  FaUserCheck,
  FaRegCommentDots,
} from "react-icons/fa6";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { MILESTONE_MEDALS } from "@/lib/types/streak";
import { VERIFICATION_TIERS } from "@/lib/utils/verification";

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  verificationTier?: string | null;
  currentStreak?: number;
  bestStreak?: number;
  currentMilestoneName?: string;
  mutualFriends?: { id: string; name: string; avatarUrl: string }[];
  isFollowing?: boolean;
}

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileData | null;
  onToggleFollow?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export function UserProfilePopup({
  isOpen,
  onClose,
  user,
  onToggleFollow,
  onMessage,
}: UserProfilePopupProps) {
  const [imgError, setImgError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user?.isFollowing || false);

  if (!isOpen || !user) return null;

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";
  const mutuals = user.mutualFriends || [];

  // Find current milestone/medal title if not provided
  const currentStreak = user.currentStreak || 0;

  const handleFollowClick = () => {
    setIsFollowing((prev) => !prev);
    if (onToggleFollow) onToggleFollow(user.id);
  };

  const tier = user.verificationTier;

  const badgeColor =
    (tier &&
      VERIFICATION_TIERS[tier as keyof typeof VERIFICATION_TIERS]?.hexColor) ||
    "#ff0000";
  const medal = [...MILESTONE_MEDALS]
    .sort((a, b) => b.targetDays - a.targetDays)
    .find((m) => currentStreak >= m.targetDays);

  const MedalIcon = medal?.icon;
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          {/* Backdrop Click to Close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Popup Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-sm rounded-4xl bg-black border border-neutral-800 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10 text-left"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 z-20 size-8 rounded-full bg-black/60 hover:bg-black/90 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
            >
              <IoClose className="size-4" />
            </button>

            {/* Banner Section */}
            <div className="relative h-32 w-full bg-neutral-900 overflow-hidden">
              {user.bannerUrl && !bannerError ? (
                <img
                  src={user.bannerUrl}
                  alt="Profile Banner"
                  onError={() => setBannerError(true)}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-linear-to-r from-neutral-900 via-red-950/30 to-neutral-900" />
              )}
            </div>

            {/* Content Body */}
            <div className="px-5 pb-6 relative">
              {/* Avatar overlapping banner */}
              <div className="flex justify-between items-end -mt-10 mb-3">
                <div
                  style={{ borderColor: `${badgeColor}` }}
                  className="relative size-20 rounded-full p-1 bg-neutral-950 border-4 border-primary shadow-xl overflow-hidden"
                >
                  {user.avatarUrl && !imgError ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="size-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="size-full rounded-full bg-neutral-900 flex items-center justify-center text-lg font-bold text-white">
                      {initial}
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Verified Badge */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h2 className="text-base font-black text-white tracking-tight truncate">
                    {user.name}
                  </h2>
                  {user.verificationTier && (
                    <VerifiedBadge
                      tier={user.verificationTier}
                      name={user.name}
                      showLabel
                      size="sm"
                    />
                  )}
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  {user.email || "@member"}
                </p>
              </div>

              {/* Bio */}
              <p className="text-xs text-neutral-300 leading-relaxed mb-4 line-clamp-3">
                {user.bio ||
                  "Passionate about daily scripture, spiritual growth, and building consistent habits with God."}
              </p>

              {/* Streak & Milestone Stats Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-4 ">
                <div className="flex items-center gap-3">
                  <div className="p- text-primary">
                    <FaFire className="size-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">
                      Streak
                    </span>
                    <span className=" font-bold text-white">
                      {currentStreak} Days
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-l border-neutral-800 pl-3">
                  <div className=" text-neutral-200 flex items-center justify-center">
                    {MedalIcon ? <MedalIcon size={24} /> : <FaFire size={24} />}
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block truncate">
                      Milestone
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {medal?.name ?? "First Steps"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mutual Friends / Stacked Avatars */}
              {mutuals.length > 0 && (
                <div className="flex items-center gap-2 mb-5 px-1">
                  <div className="flex -space-x-2">
                    {mutuals.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="size-6 rounded-full overflow-hidden border border-neutral-900 bg-neutral-800"
                      >
                        <img
                          src={m.avatarUrl}
                          alt={m.name}
                          className="size-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Followed by {mutuals[0]?.name}
                    {mutuals.length > 1
                      ? ` and ${mutuals.length - 1} others`
                      : ""}
                  </span>
                </div>
              )}

              {/* Action Buttons: Follow & Message */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleFollowClick}
                  className={`py-3 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isFollowing
                      ? "bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800"
                      : "bg-red-600 text-white hover:bg-primary shadow-lg shadow-red-950/50"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <FaUserCheck className="size-3.5 text-primary" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="size-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onMessage) onMessage(user.id);
                  }}
                  className="py-3 px-4 rounded-full bg-neutral-950 hover:bg-neutral-900 text-white border border-neutral-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <FaRegCommentDots className="size-3.5 text-neutral-400" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
