/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  FaFire,
  FaUser,
  FaSearch,
  FaTrophy,
  FaCrown,
  FaMedal,
  FaChevronLeft,
} from "react-icons/fa";
import Link from "next/link";

export interface UserAnalyticsItem {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate?: string;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"september" | "allTime">("september");

  useEffect(() => {
    // Fire top confetti burst when page loads
    const fireConfetti = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.1 },
        colors: ["#ef4444", "#dc2626", "#f59e0b", "#ffffff"],
      });
    };

    fireConfetti();

    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          // Sort users by streak from highest to lowest
          const sorted = (data.users || []).sort(
            (a: UserAnalyticsItem, b: UserAnalyticsItem) =>
              (b.currentStreak || 0) - (a.currentStreak || 0) ||
              (b.highestStreak || 0) - (a.highestStreak || 0)
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

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Split top 3 podium entries vs remaining list entries
  const top1 = filteredUsers[0];
  const top2 = filteredUsers[1];
  const top3 = filteredUsers[2];
  const listUsers = filteredUsers.slice(3);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Background Glow Overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />

      <main className="w-full max-w-xl z-10 space-y-6">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors py-2 px-3.5 rounded-full bg-neutral-900/80 border border-neutral-800"
          >
            <FaChevronLeft className="size-3" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-neutral-300 tracking-wide uppercase">
              Live Standings
            </span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="text-center space-y-1.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2.5">
            <FaTrophy className="text-amber-400 size-6 sm:size-7" />
            Streak Leaderboard
          </h1>
          <p className="text-xs text-neutral-400">
            Top devotion champions for <span className="text-red-400 font-semibold">September 2026</span>
          </p>
        </div>

        {/* Filter Toggle Switch */}
        <div className="p-1 rounded-2xl bg-neutral-900 border border-neutral-800/80 flex items-center max-w-xs mx-auto">
          <button
            onClick={() => setActiveTab("september")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "september"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            September
          </button>
          <button
            onClick={() => setActiveTab("allTime")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "allTime"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All Time
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs mx-auto">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-3.5" />
          <input
            type="text"
            placeholder="Find your position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 outline-none focus:border-red-500/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-3xl border border-neutral-850">
            Fetching standings...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-3xl border border-neutral-850">
            No active participants found.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Podium Container */}
            <div className="pt-8 pb-4 px-4 bg-gradient-to-b from-neutral-900/90 to-neutral-950 rounded-3xl border border-neutral-850 shadow-2xl relative overflow-hidden">
              <div className="flex items-end justify-center gap-3 sm:gap-6 min-h-[220px]">
                {/* 2nd Place */}
                <div className="flex flex-col items-center flex-1 max-w-[110px]">
                  {top2 ? (
                    <>
                      <div className="relative mb-2">
                        {top2.avatar_url ? (
                          <img
                            src={top2.avatar_url}
                            alt={top2.name}
                            className="size-14 sm:size-16 rounded-full object-cover border-2 border-slate-400 shadow-md"
                          />
                        ) : (
                          <div className="size-14 sm:size-16 rounded-full bg-neutral-800 border-2 border-slate-400 flex items-center justify-center text-slate-300">
                            <FaUser className="size-6" />
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
                      {/* Podium Pillar */}
                      <div className="w-full h-24 bg-gradient-to-t from-neutral-900 to-slate-500/20 rounded-t-2xl border-t border-x border-slate-400/30 flex items-center justify-center text-2xl font-black text-slate-400/40 mt-3">
                        2
                      </div>
                    </>
                  ) : (
                    <div className="h-24 w-full bg-neutral-900/50 rounded-t-2xl" />
                  )}
                </div>

                {/* 1st Place (Winner) */}
                <div className="flex flex-col items-center flex-1 max-w-[125px] -mt-6">
                  {top1 ? (
                    <>
                      <div className="relative mb-2">
                        <FaCrown className="size-6 text-amber-400 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                        {top1.avatar_url ? (
                          <img
                            src={top1.avatar_url}
                            alt={top1.name}
                            className="size-16 sm:size-20 rounded-full object-cover border-2 border-amber-400 shadow-xl shadow-amber-500/20"
                          />
                        ) : (
                          <div className="size-16 sm:size-20 rounded-full bg-neutral-800 border-2 border-amber-400 flex items-center justify-center text-amber-400">
                            <FaUser className="size-7" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-neutral-950 font-black text-xs size-6 rounded-full flex items-center justify-center border border-neutral-950 shadow-md">
                          1
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-full text-center">
                        {top1.name}
                      </span>
                      <div className="flex items-center gap-1 text-red-500 font-extrabold text-sm mt-0.5">
                        <FaFire className="size-3.5" />
                        <span>{top1.currentStreak || 0}</span>
                      </div>
                      {/* Podium Pillar */}
                      <div className="w-full h-32 bg-gradient-to-t from-neutral-900 to-amber-500/20 rounded-t-2xl border-t border-x border-amber-400/40 flex items-center justify-center text-3xl font-black text-amber-400/40 mt-3">
                        1
                      </div>
                    </>
                  ) : null}
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center flex-1 max-w-[110px]">
                  {top3 ? (
                    <>
                      <div className="relative mb-2">
                        {top3.avatar_url ? (
                          <img
                            src={top3.avatar_url}
                            alt={top3.name}
                            className="size-14 sm:size-16 rounded-full object-cover border-2 border-amber-700 shadow-md"
                          />
                        ) : (
                          <div className="size-14 sm:size-16 rounded-full bg-neutral-800 border-2 border-amber-700 flex items-center justify-center text-amber-600">
                            <FaUser className="size-6" />
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
                      {/* Podium Pillar */}
                      <div className="w-full h-16 bg-gradient-to-t from-neutral-900 to-amber-800/20 rounded-t-2xl border-t border-x border-amber-700/30 flex items-center justify-center text-xl font-black text-amber-700/40 mt-3">
                        3
                      </div>
                    </>
                  ) : (
                    <div className="h-16 w-full bg-neutral-900/50 rounded-t-2xl" />
                  )}
                </div>
              </div>
            </div>

            {/* Remaining Ranks List Card */}
            {listUsers.length > 0 && (
              <div className="bg-neutral-900/80 rounded-3xl border border-neutral-850 p-2 sm:p-3 divide-y divide-neutral-850">
                {listUsers.map((user, idx) => {
                  const rank = idx + 4;
                  return (
                    <motion.div
                      key={user.id || rank}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="flex items-center justify-between p-3 sm:p-3.5 hover:bg-neutral-850/50 rounded-2xl transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-black text-neutral-500 w-7 text-center shrink-0">
                          {rank < 10 ? `0${rank}` : rank}
                        </span>

                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="size-9 rounded-full object-cover border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="size-9 rounded-full bg-neutral-800 border border-neutral-750 flex items-center justify-center text-neutral-400 shrink-0">
                            <FaUser className="size-3.5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-neutral-200 truncate">
                            {user.name || "Anonymous User"}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-red-500 font-extrabold text-xs shrink-0 ml-3 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        <FaFire className="size-3.5" />
                        <span>{user.currentStreak || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
