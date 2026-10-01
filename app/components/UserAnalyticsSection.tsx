/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FaFire, FaUser, FaEnvelope, FaSearch, FaTrophy, FaChartPie } from "react-icons/fa";

export interface UserAnalyticsItem {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  highestStreak: number;
  lastActiveDate?: string;
}

// Distinct, high-contrast color palette for streak group slices
const COLOR_PALETTE = [
  "#f97316", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#84cc16", // Lime
];

interface StreakGroup {
  streak: number;
  count: number;
  percentage: number;
  color: string;
}

export default function UserAnalyticsSection() {
  const [users, setUsers] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredStreak, setHoveredStreak] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
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

  // Compute dynamic streak groupings for the pie chart
  const streakGroups = useMemo<StreakGroup[]>(() => {
    if (!users.length) return [];

    const countsMap = users.reduce((acc, user) => {
      const streak = user.currentStreak || 0;
      acc[streak] = (acc[streak] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Sort descending by streak duration
    const sortedStreaks = Object.keys(countsMap)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedStreaks.map((streak, idx) => ({
      streak,
      count: countsMap[streak],
      percentage: (countsMap[streak] / users.length) * 100,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
    }));
  }, [users]);

  // Compute SVG slice paths for pie chart
  const pieSlices = useMemo(() => {
    let cumulativeAngle = 0;
    const totalUsers = users.length;
    if (totalUsers === 0) return [];

    return streakGroups.map((group) => {
      const angle = (group.count / totalUsers) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      // Handle full circle case when only 1 group exists
      if (angle >= 359.9) {
        return {
          ...group,
          pathData: "M 50 10 A 40 40 0 1 1 49.99 10 Z",
        };
      }

      // Convert polar coordinates to Cartesian
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = `M 50 50 L ${x1.toFixed(2)} ${y1.toFixed(
        2
      )} A 40 40 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

      return {
        ...group,
        pathData,
      };
    });
  }, [streakGroups, users.length]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStreak =
      hoveredStreak === null || (u.currentStreak || 0) === hoveredStreak;

    return matchesSearch && matchesStreak;
  });

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

      {/* Dynamic Streak Distribution Pie Chart Card */}
      {!loading && streakGroups.length > 0 && (
        <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FaChartPie className="text-red-500 size-4" /> Streak Distribution
            </h3>
            {hoveredStreak !== null && (
              <button
                onClick={() => setHoveredStreak(null)}
                className="text-[11px] text-neutral-400 hover:text-white transition-colors underline underline-offset-2"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-2">
            {/* SVG Donut / Pie Chart */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {pieSlices.map((slice) => {
                  const isSelected = hoveredStreak === slice.streak;
                  const isDimmed = hoveredStreak !== null && !isSelected;

                  return (
                    <path
                      key={slice.streak}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        opacity: isDimmed ? 0.3 : 1,
                        transform: isSelected ? "scale(1.04)" : "scale(1)",
                        transformOrigin: "center",
                      }}
                      onMouseEnter={() => setHoveredStreak(slice.streak)}
                      onMouseLeave={() => setHoveredStreak(null)}
                    />
                  );
                })}
                {/* Inner ring for donut style */}
                <circle cx="50" cy="50" r="22" className="fill-neutral-950" />
              </svg>

              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-black text-white">
                  {hoveredStreak !== null
                    ? streakGroups.find((g) => g.streak === hoveredStreak)?.count
                    : users.length}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">
                  {hoveredStreak !== null ? `${hoveredStreak}d Streak` : "Total Users"}
                </span>
              </div>
            </div>

            {/* Dynamic Color Legend Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
              {streakGroups.map((group) => {
                const isActive = hoveredStreak === group.streak;

                return (
                  <div
                    key={group.streak}
                    onMouseEnter={() => setHoveredStreak(group.streak)}
                    onMouseLeave={() => setHoveredStreak(null)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? "bg-neutral-900 border-neutral-700 shadow-lg scale-[1.02]"
                        : "bg-neutral-900/50 border-neutral-900 hover:border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-xs font-bold text-neutral-200 truncate">
                        {group.streak} {group.streak === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <div className="text-right ml-2 shrink-0">
                      <span className="text-xs font-bold text-white block">
                        {group.count}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {group.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-950/50 rounded-2xl border border-neutral-900">
          Loading user streaks...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 bg-neutral-950/50 rounded-2xl border border-neutral-900">
          No users matching query or selected streak group.
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
