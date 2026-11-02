
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

// DATA
import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  FaUserPlus,
  FaUserCheck,
  FaFire,
  FaTrophy,
  FaUser,
} from "react-icons/fa6";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { MILESTONE_MEDALS } from "@/lib/types/streak";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface SuggestedUser {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  followersCount: number;
  currentStreak: number;
  highestStreak: number;
  isFollowing: boolean;
  verification_tier?: string | null;
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const session = (await supabase?.auth.getSession())?.data?.session;
  return session?.access_token ?? null;
}
const skeletonContainerVariants:Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const skeletonCardVariants:Variants = {
  hidden: {
    opacity: 0,
    y: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut" as const,
    },
  },
};


function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}


// SKELETON CARD
function SuggestedUserSkeleton() {
  return (
    <motion.div
      variants={skeletonCardVariants}
      className="relative bg-neutral-950 border border-neutral-800/80 rounded-3xl p-4 flex flex-col shadow-xl overflow-hidden"
    >
      {/* Banner */}
      <div className="relative h-20 -mx-4 -mt-4 mb-3 bg-neutral-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent animate-pulse" />
      </div>

      {/* Avatar */}
      <div className="flex items-center justify-between -mt-10 mb-3 z-10">
        <div className="size-14 rounded-full bg-neutral-800 border-2 border-neutral-700 animate-pulse" />
      </div>

      {/* User details */}
      <div className="mb-4 space-y-2">
        <div className="h-3.5 w-32 rounded-full bg-neutral-800 animate-pulse" />
        <div className="h-2.5 w-24 rounded-full bg-neutral-900 animate-pulse" />
      </div>

      {/* Streak, followers and milestone */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-neutral-900 mb-4">
        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-12 rounded-full bg-neutral-900 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2 border-x border-neutral-900">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-8 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-14 rounded-full bg-neutral-900 animate-pulse" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="size-4 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-3 w-14 rounded-full bg-neutral-800 animate-pulse" />
          <div className="h-2 w-14 rounded-full bg-neutral-900 animate-pulse" />
        </div>
      </div>

      {/* Follow button */}
      <div className="h-10 w-full rounded-full bg-neutral-800 animate-pulse" />
    </motion.div>
  );
}

// LOGIC
export function SuggestedUsersSection() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingId, setFollowingId] = useState<string | null>(null);

  // Load all users from the existing admin users endpoint
  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);

      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch("/api/admin/users", {
          headers,
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load users");
        }

        const formatted: SuggestedUser[] = (data.users ?? []).map(
          (u: any) => ({
            id: u.id,
            name: u.name || "Bridge Believer",
            email: u.email,
            avatar_url: u.avatar_url || "",
            followersCount: Number(u.followersCount ?? 0),
            currentStreak: Number(u.currentStreak ?? 0),
            highestStreak: Number(u.highestStreak ?? 0),
            isFollowing: Boolean(u.isFollowing),
            verification_tier: u.verification_tier ?? null,
          }),
        );

        if (!cancelled) {
          setUsers(formatted);
        }
      } catch (err) {
        console.error("Failed to load suggested users:", err);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Follow or unfollow using your existing endpoint
  const toggleFollow = async (id: string) => {
    if (followingId) return;

    try {
      setFollowingId(id);

      const token = await getAccessToken();

      if (!token) {
        alert("Please sign in to follow people.");
        return;
      }

      const res = await fetch(`/api/users/${id}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow");
      }

      setUsers((prev) =>
        prev.map((user) => {
          if (user.id !== id) return user;

          const isNowFollowing = Boolean(data.isFollowing);

          return {
            ...user,
            isFollowing: isNowFollowing,
            followersCount: Math.max(
              0,
              user.followersCount + (isNowFollowing ? 1 : -1),
            ),
          };
        }),
      );
    } catch (err: any) {
      alert(err.message || "Failed to update follow");
    } finally {
      setFollowingId(null);
    }
  };

  // Use the same milestone definitions as UserProfilePopup
  const getMilestone = (streak: number) =>
    [...MILESTONE_MEDALS]
      .sort((a, b) => b.targetDays - a.targetDays)
      .find((m) => streak >= m.targetDays);

  return (
    <div className="mt-8 pt-6 border-t border-neutral-800 space-y-6">

      <div className="px-3">
        <h3 className="text-sm font-black text-white tracking-wider font-mono uppercase">
          Suggested For You
        </h3>
        <p className="text-[11px] text-neutral-400">
          Discover and connect with other believers on Bridge Daily.
        </p>
      </div>

      {isLoading ? (
          <motion.div
          variants={skeletonContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <SuggestedUserSkeleton key={index} />
          ))}
        </motion.div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-500">
          No suggested users available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-2">
          {users.map((user) => {
            const milestone = getMilestone(user.currentStreak);
            const isBusy = followingId === user.id;

            return (
              <motion.div
                key={user.id}
                whileHover={{ scale: 1.01 }}
                className="relative bg-neutral-950 border border-neutral-800/80 rounded-3xl p-4 flex flex-col shadow-xl overflow-hidden"
              >
                {/* Banner */}
                <div className="relative h-20 -mx-4 -mt-4 mb-3 bg-linear-to-r from-neutral-900 via-red-950/40 to-neutral-900" />

                {/* Avatar */}
                <div className="flex items-center justify-between -mt-10 mb-3 z-10">
                  <div className="size-14 rounded-full bg-neutral-900 border-2 border-red-600 overflow-hidden flex items-center justify-center shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* User details */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-white truncate">
                      {user.name}
                    </h4>

                    {user.verification_tier && (
                      <VerifiedBadge
                        tier={user.verification_tier}
                        name={user.name}
                        size="sm"
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-500">
                    Bridge Daily Member
                  </p>
                </div>

                {/* Streak, followers and milestone */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-neutral-900 mb-4">

                  <div className="text-center">
                    <FaFire className="text-red-500 mx-auto mb-1 size-4" />
                    <p className="text-sm font-bold text-white">
                      {user.currentStreak}
                    </p>
                    <p className="text-[9px] text-neutral-500 uppercase">
                      Streak
                    </p>
                  </div>

                  <div className="text-center border-x border-neutral-900">
                    <FaUser className="text-blue-400 mx-auto mb-1 size-4" />
                    <p className="text-sm font-bold text-white">
                      {formatCount(user.followersCount)}
                    </p>
                    <p className="text-[9px] text-neutral-500 uppercase">
                      Followers
                    </p>
                  </div>

                  <div className="text-center min-w-0">
                    <FaTrophy className="text-amber-400 mx-auto mb-1 size-4" />
                    <p className="text-[10px] font-bold text-white truncate px-1">
                      {milestone?.name ?? "First Steps"}
                    </p>
                    <p className="text-[9px] text-neutral-500 uppercase">
                      Milestone
                    </p>
                  </div>

                </div>

                {/* Follow button */}
                <button
                  type="button"
                  disabled={isBusy || followingId !== null}
                  onClick={() => toggleFollow(user.id)}
                  className={`w-full py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    user.isFollowing
                      ? "bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800"
                      : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-950/50"
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <FaUserCheck className="size-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="size-3.5" />
                      {isBusy ? "Following..." : "Follow"}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
