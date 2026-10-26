/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FaFire, FaUser, FaTrophy, FaCrown } from "react-icons/fa";
import { ChevronLeft } from "lucide-react";

// Imports
import VerifiedBadge from "@/app/components/VerifiedBadge";
import FloatingVideoPlayer from "@/app/components/FloatingVideoPlayer";

export interface UserAnalyticsItem {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  verification_tier?: string | null;
  highestStreak: number;
  lastActiveDate?: string;
  createdAt?: string;
  lastSignedIn?: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "allTime">("monthly");

  // Dynamic Current Month Name Calculation (e.g. "October 2026")
  const currentMonthName = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  const currentMonthShort = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long" });
  }, []);

  useEffect(() => {
    // 30-Second Continuous Confetti (Reduced particle density)
    const duration = 30 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.2 },
        colors: ["#ef4444", "#dc2626", "#f59e0b", "#ffffff"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.2 },
        colors: ["#ef4444", "#dc2626", "#f59e0b", "#ffffff"],
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();

          // Filter out Alexander D Bridge and Alexander Christ
          const filtered = (data.users || []).filter((u: UserAnalyticsItem) => {
            const nameLower = (u.name || "").toLowerCase().trim();
            return (
              nameLower !== "alexander d bridge" &&
              nameLower !== "alexander christ"
            );
          });

          setUsers(filtered);
        }
      } catch (err) {
        console.error("Failed to load user analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Dynamic Sorting Logic based on active tab ("monthly" vs "allTime")
  const sortedUsers = useMemo(() => {
    const copy = [...users];
    return copy.sort((a, b) => {
      const streakA =
        activeTab === "monthly" ? a.currentStreak || 0 : a.highestStreak || 0;
      const streakB =
        activeTab === "monthly" ? b.currentStreak || 0 : b.highestStreak || 0;

      if (streakB !== streakA) {
        return streakB - streakA; // Higher streak wins
      }

      // Tie-breaker: Who recorded/updated their streak earliest?
      const timeA = a.lastActiveDate
        ? new Date(a.lastActiveDate).getTime()
        : Infinity;
      const timeB = b.lastActiveDate
        ? new Date(b.lastActiveDate).getTime()
        : Infinity;

      if (timeA !== timeB) {
        return timeA - timeB; // Earlier time comes first
      }

      // Fallback tie-breaker: Account creation date
      const createdA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
      const createdB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;

      return createdA - createdB;
    });
  }, [users, activeTab]);

  // Split top 3 podium entries vs remaining list entries
  const top1 = sortedUsers[0];
  const top2 = sortedUsers[1];
  const top3 = sortedUsers[2];
  const listUsers = sortedUsers.slice(3);

  return (
    <div className="h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden relative">
      {/* Floating Video Player Component */}
      <FloatingVideoPlayer
        videos={[
          {
            id: "devotional-vid-active",
            videoUrl:
              "https://res.cloudinary.com/dd5ppwbyi/video/upload/v1791876484/lv_0_20261013082356_w01hdo.mp4",
            title: "Daily Devotional Message",
          },
        ]}
      />

      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP SECTION: Dark Theme Podium & Header */}
      <div className="w-full max-w-xl mx-auto pt-6 -mb-2 px-4 sm:px-6 shrink-0 relative z-10">
        {/* Glassmorphism Back Button & Header Badge */}
        <div className="relative flex items-center justify-center mb-3">
          <button
            onClick={() => router.push("/devotional")}
            aria-label="Back to Devotional"
            className="absolute left-0 p-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white hover:bg-white/20 active:scale-95 transition-all shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
              Live Standings
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mb-5 pt-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2.5">
            <FaTrophy className="text-amber-400 size-6 sm:size-7" />
            Streak Leaderboard
          </h1>
          <p className="text-xs text-neutral-400">
            Top devotion champions for{" "}
            <span className="text-red-400 font-semibold">
              {currentMonthName}
            </span>
          </p>
        </div>

        {/* Dynamic Filter Toggle Switch */}
        <div className="p-1 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center max-w-xs mx-auto mb-6">
          <button
            onClick={() => setActiveTab("monthly")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "monthly"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {currentMonthShort}
          </button>
          <button
            onClick={() => setActiveTab("allTime")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "allTime"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>

        {/* Podium Area */}
        {!loading && sortedUsers.length > 0 && (
          <div className="pt-6 pb-2 relative overflow-visible">
            <div className="flex items-end justify-center gap-3 sm:gap-6 min-h-47.5">
              {/* Rank 2 */}
              <div className="flex flex-col items-center flex-1 max-w-27.5">
                {top2 ? (
                  <>
                    <div className="relative mb-1.5">
                      {top2.avatar_url ? (
                        <img
                          src={top2.avatar_url}
                          alt={top2.name}
                          className="size-12 sm:size-14 rounded-full object-cover border-2 border-slate-400 shadow-md"
                        />
                      ) : (
                        <div className="size-12 sm:size-14 rounded-full bg-neutral-800 border-2 border-slate-400 flex items-center justify-center text-slate-300">
                          <FaUser className="size-5" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-slate-400 text-neutral-950 font-black text-[10px] size-5 rounded-full flex items-center justify-center border border-neutral-950">
                        2
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 max-w-full">
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {top2.name}
                      </span>
                      <VerifiedBadge
                        name={top2.name}
                        email={top2.email}
                        tier={top2.verification_tier}
                        size="xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-primary font-extrabold text-xs mt-0.5">
                      <FaFire className="size-3" />
                      <span>
                        {activeTab === "monthly"
                          ? top2.currentStreak || 0
                          : top2.highestStreak || 0}
                      </span>
                    </div>
                    <div className="w-full h-20 bg-linear-to-t from-neutral-900 to-slate-500/20 rounded-t-2xl border-t border-x border-slate-400/30 flex items-center justify-center text-2xl font-black text-slate-400/40 mt-2">
                      2
                    </div>
                  </>
                ) : (
                  <div className="h-20 w-full bg-neutral-900/50 rounded-t-2xl" />
                )}
              </div>

              {/* Rank 1 (Winner) */}
              <div className="flex flex-col items-center flex-1 max-w-31.25 -mt-5">
                {top1 ? (
                  <>
                    <div className="relative mb-1.5">
                      <FaCrown className="size-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                      {top1.avatar_url ? (
                        <img
                          src={top1.avatar_url}
                          alt={top1.name}
                          className="size-16 sm:size-18 rounded-full object-cover border-2 border-amber-400 shadow-xl shadow-amber-500/20"
                        />
                      ) : (
                        <div className="size-16 sm:size-18 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                          <FaUser className="size-6" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-neutral-950 font-black text-xs size-5 rounded-full flex items-center justify-center border border-neutral-950 shadow-md">
                        1
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 max-w-full">
                      <span className="text-xs font-bold text-white truncate">
                        {top1.name}
                      </span>
                      <VerifiedBadge
                        name={top1.name}
                        email={top1.email}
                        tier={top1.verification_tier}
                        size="xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-primary font-extrabold text-xs sm:text-sm mt-0.5">
                      <FaFire className="size-3.5" />
                      <span>
                        {activeTab === "monthly"
                          ? top1.currentStreak || 0
                          : top1.highestStreak || 0}
                      </span>
                    </div>
                    <div className="w-full h-28 bg-linear-to-t from-neutral-900 to-amber-500/20 rounded-t-2xl border-t border-x border-amber-400/40 flex items-center justify-center text-3xl font-black text-amber-400/40 mt-2">
                      1
                    </div>
                  </>
                ) : null}
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center flex-1 max-w-27.5">
                {top3 ? (
                  <>
                    <div className="relative mb-1.5">
                      {top3.avatar_url ? (
                        <img
                          src={top3.avatar_url}
                          alt={top3.name}
                          className="size-12 sm:size-14 rounded-full object-cover border-2 border-amber-700 shadow-md"
                        />
                      ) : (
                        <div className="size-12 sm:size-14 rounded-full bg-neutral-800 border-2 border-amber-700 flex items-center justify-center text-amber-600">
                          <FaUser className="size-5" />
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-amber-700 text-white font-black text-[10px] size-5 rounded-full flex items-center justify-center border border-neutral-950">
                        3
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 max-w-full">
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {top3.name}
                      </span>
                      <VerifiedBadge
                        name={top3.name}
                        email={top3.email}
                        tier={top1.verification_tier}
                        size="xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-primary font-extrabold text-xs mt-0.5">
                      <FaFire className="size-3" />
                      <span>
                        {activeTab === "monthly"
                          ? top3.currentStreak || 0
                          : top3.highestStreak || 0}
                      </span>
                    </div>
                    <div className="w-full h-14 bg-linear-to-t from-neutral-900 to-amber-800/20 rounded-t-2xl border-t border-x border-amber-700/30 flex items-center justify-center text-xl font-black text-amber-700/40 mt-2">
                      3
                    </div>
                  </>
                ) : (
                  <div className="h-14 w-full bg-neutral-900/50 rounded-t-2xl" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: Slide-Up White Card containing full list */}
      <div className="flex-1 w-full bg-white text-neutral-900 rounded-t-4xl shadow-2xl overflow-y-auto z-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12">
          {loading ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              Loading rankings...
            </div>
          ) : listUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400">
              No additional rankings available.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {listUsers.map((user, idx) => {
                const rank = idx + 4;
                const streakDisplay =
                  activeTab === "monthly"
                    ? user.currentStreak || 0
                    : user.highestStreak || 0;

                return (
                  <motion.div
                    key={user.id || rank}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-neutral-50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-black text-neutral-400 w-6 text-center shrink-0">
                        {rank < 10 ? `0${rank}` : rank}
                      </span>

                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="size-10 rounded-full object-cover border border-neutral-200 shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 shrink-0">
                          <FaUser className="size-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {user.name || "Anonymous User"}
                        </h3>
                        <VerifiedBadge
                          name={user.name}
                          email={user.email}
                          size="xs"
                          tier={user.verification_tier}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-red-600 font-black text-xs shrink-0 ml-3 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                      <FaFire className="size-3.5" />
                      <span>{streakDisplay}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
