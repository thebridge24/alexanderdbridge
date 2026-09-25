/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaFire, FaUser, FaEnvelope, FaSearch, FaTrophy } from "react-icons/fa";

export interface UserAnalyticsItem {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate?: string;
}

export default function UserAnalyticsSection() {
  const [users, setUsers] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          // Sort users by highest streak (or current streak) from top to bottom
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

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-950 border border-neutral-900">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FaTrophy className="text-amber-500 size-5" /> User Leaderboard & Streaks
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Total Users: <span className="text-white font-bold">{users.length}</span>
          </p>
        </div>

        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-3.5" />
          <input
            type="text"
            placeholder="Search user or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 outline-none focus:border-red-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-950/50 rounded-2xl border border-neutral-900">
          Loading user streaks...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-950/50 rounded-2xl border border-neutral-900">
          No users matching query.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, idx) => (
            <div
              key={user.id || idx}
              className="flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-900/80 hover:border-neutral-800 transition-colors"
            >
              {/* User Identity Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="font-mono text-xs font-bold text-neutral-500 w-6 text-center">
                  #{idx + 1}
                </span>

                {user.avatar_url ? (
                  // eslint-disable-next-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.name || "User Avatar"}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-800 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                    <FaUser className="size-4" />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-neutral-200 truncate">
                    {user.name || "Anonymous User"}
                  </h3>
                  <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                    <FaEnvelope className="size-3 text-neutral-500 shrink-0" />
                    <span className="truncate">{user.email || "No email available"}</span>
                  </p>
                </div>
              </div>

              {/* Streak Stats */}
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-red-500 font-black text-sm">
                    <FaFire className="size-4 animate-pulse" />
                    <span>{user.currentStreak || 0}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Current Streak
                  </span>
                </div>

                <div className="h-8 w-px bg-neutral-850 hidden sm:block" />

                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-neutral-300">
                    {user.highestStreak || user.currentStreak || 0} days
                  </span>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                    Best Streak
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}