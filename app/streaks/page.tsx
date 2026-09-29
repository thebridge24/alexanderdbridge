/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { FaFire, FaUser, FaTrophy, FaCrown } from "react-icons/fa";

export interface UserAnalyticsItem {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate?: string;
  createdAt?: string;
  lastSignedIn?: string;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"september" | "allTime">("september");

  useEffect(() => {
    // 30-Second Continuous Confetti (Reduced particle density)
    const duration = 30 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3, // Reduced particle density per burst
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.2 },
        colors: ["#ef4444", "#dc2626", "#f59e0b", "#ffffff"],
      });
      confetti({
        particleCount: 3, // Reduced particle density per burst
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

          // Sort Users Logic:
          // 1. Highest currentStreak
          // 2. Earliest timestamp of last active/visit date (First-come, first-served)
          // 3. Earliest account creation date
          const sorted = filtered.sort(
            (a: UserAnalyticsItem, b: UserAnalyticsItem) => {
              const streakA = a.currentStreak || 0;
              const streakB = b.currentStreak || 0;

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
              const createdA = a.createdAt
                ? new Date(a.createdAt).getTime()
                : Infinity;
              const createdB = b.createdAt
                ? new Date(b.createdAt).getTime()
                : Infinity;

              return createdA - createdB;
            }
          );

          setUsers(sorted);
        }
      } catch (err) {
        console.error("Failed to load user analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Split top 3 podium entries vs remaining list entries
  const top1 = users[0];
  const top2 = users[1];
  const top3 = users[2];
  const listUsers = users.slice(3);

  return (
    <div className="h-screen w-full bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* TOP SECTION: Dark Theme Podium & Header */}
      <div className="w-full max-w-xl mx-auto pt-8 pb-6 px-4 sm:px-6 shrink-0 relative z-10">
        {/* Header Badge */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-block size-2 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
            Live Standings
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2.5">
            <FaTrophy className="text-amber-400 size-6 sm:size-7" />
            Streak Leaderboard
          </h1>
          <p className="text-xs text-neutral-400">
            Top devotion champions for <span className="text-red-400 font-semibold">September 2026</span>
          </p>
        </div>

        {/* Filter Toggle Switch */}
        <div className="p-1 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center max-w-xs mx-auto mb-6">
          <button
            onClick={() => setActiveTab("september")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === "september"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            September
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
        {!loading && users.length > 0 && (
          <div className="pt-6 pb-2 relative overflow-visible">
            <div className="flex items-end justify-center gap-3 sm:gap-6 min-h-[190px]">
              {/* Rank 2 */}
              <div className="flex flex-col items-center flex-1 max-w-[110px]">
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
                    <span className="text-xs font-bold text-neutral-200 truncate max-w-full text-center">
                      {top2.name}
                    </span>
                    <div className="flex items-center gap-1 text-red-500 font-extrabold text-xs mt-0.5">
                      <FaFire className="size-3" />
                      <span>{top2.currentStreak || 0}</span>
                    </div>
                    <div className="w-full h-20 bg-gradient-to-t from-neutral-900 to-slate-500/20 rounded-t-2xl border-t border-x border-slate-400/30 flex items-center justify-center text-2xl font-black text-slate-400/40 mt-2">
                      2
                    </div>
                  </>
                ) : (
                  <div className="h-20 w-full bg-neutral-900/50 rounded-t-2xl" />
                )}
              </div>

              {/* Rank 1 (Winner) */}
              <div className="flex flex-col items-center flex-1 max-w-[125px] -mt-5">
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
                    <span className="text-xs font-bold text-white truncate max-w-full text-center">
                      {top1.name}
                    </span>
                    <div className="flex items-center gap-1 text-red-500 font-extrabold text-xs sm:text-sm mt-0.5">
                      <FaFire className="size-3.5" />
                      <span>{top1.currentStreak || 0}</span>
                    </div>
                    <div className="w-full h-28 bg-gradient-to-t from-neutral-900 to-amber-500/20 rounded-t-2xl border-t border-x border-amber-400/40 flex items-center justify-center text-3xl font-black text-amber-400/40 mt-2">
                      1
                    </div>
                  </>
                ) : null}
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center flex-1 max-w-[110px]">
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
                    <span className="text-xs font-bold text-neutral-200 truncate max-w-full text-center">
                      {top3.name}
                    </span>
                    <div className="flex items-center gap-1 text-red-500 font-extrabold text-xs mt-0.5">
                      <FaFire className="size-3" />
                      <span>{top3.currentStreak || 0}</span>
                    </div>
                    <div className="w-full h-14 bg-gradient-to-t from-neutral-900 to-amber-800/20 rounded-t-2xl border-t border-x border-amber-700/30 flex items-center justify-center text-xl font-black text-amber-700/40 mt-2">
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
      <div className="flex-1 w-full bg-white text-neutral-900 rounded-t-[32px] shadow-2xl overflow-y-auto z-20">
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

                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                          {user.name || "Anonymous User"}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-red-600 font-black text-xs shrink-0 ml-3 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                      <FaFire className="size-3.5" />
                      <span>{user.currentStreak || 0}</span>
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
