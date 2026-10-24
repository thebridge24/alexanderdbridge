/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaUserCheck,
  FaCalendarAlt,
  FaSearch,
  FaChevronDown,
  FaPaperPlane,
  FaTimes,
  FaTrophy,
} from "react-icons/fa";

import { DataTable, Column } from "../components/DataTable";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { getUserVerificationTier } from "@/lib/utils/verification";
import SurveyBroadcasterModal from "@/app/components/SurveyBroadcasterModal";
import Preloader from "@/app/components/ui/Preloader";
import { ActivityPeakChart } from "./ActivityPeakChart"; // Import the real Recharts peak chart
import { MILESTONE_MEDALS } from "@/lib/types/streak";
import { FaFire } from "react-icons/fa6";
import { AppleTypewriterText } from "@/app/components/ui/AppleTypewriterText";
import { FiCalendar } from "react-icons/fi";

type TimeframeFilter = "today" | "week" | "month" | "year";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  currentStreak: number;
  highestStreak: number;
  joinedAt?: string;
  lastActiveDate?: string;
  metadata?: Record<string, any>;
}
// Helper to get the correct white milestone medal icon or fallback to FaFire
function renderStreakMedalIcon(streak: number) {
  const sortedMedals = [...MILESTONE_MEDALS].sort(
    (a, b) => b.targetDays - a.targetDays,
  );
  const earnedMedal = sortedMedals.find((m) => streak >= m.targetDays);

  const IconComponent = earnedMedal ? earnedMedal.icon : FaFire;
  const label = earnedMedal ? earnedMedal.name : "Streak";

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 text-white drop-shadow-sm"
      title={`${label} (${streak} days)`}
    >
      <IconComponent className="w-3 h-3 text-white/80" />
    </span>
  );
}

export default function UserAnalyticsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("month");
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState(false);
  const [targetRecipient, setTargetRecipient] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    async function fetchAllUsers() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to load user analytics records:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllUsers();
  }, []);

  // Filter users based on global timeframe selector
  const timeframeFilteredUsers = useMemo(() => {
    const now = new Date();
    return users.filter((u) => {
      if (!u.joinedAt) return true;
      const joinedDate = new Date(u.joinedAt);

      if (timeframe === "today") {
        return joinedDate.toDateString() === now.toDateString();
      }
      if (timeframe === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return joinedDate >= weekAgo;
      }
      if (timeframe === "month") {
        return (
          joinedDate.getMonth() === now.getMonth() &&
          joinedDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeframe === "year") {
        return joinedDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [users, timeframe]);

  // Metrics calculation
  const totalUsersCount = timeframeFilteredUsers.length;
  const activeUsersCount = useMemo(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return timeframeFilteredUsers.filter((u) => {
      if (!u.lastActiveDate) return false;
      return new Date(u.lastActiveDate) >= twoDaysAgo;
    }).length;
  }, [timeframeFilteredUsers]);

  const newThisMonthCount = useMemo(() => {
    const now = new Date();
    return users.filter((u) => {
      if (!u.joinedAt) return false;
      const d = new Date(u.joinedAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [users]);

  // Search filtered table rows
  const tableData = useMemo(() => {
    return timeframeFilteredUsers.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [timeframeFilteredUsers, searchQuery]);

  const columns: Column<UserRecord>[] = [
    {
      header: "Member",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img
              src={row.avatar_url}
              alt={row.name}
              className="size-9 rounded-full object-cover border border-neutral-800"
            />
          ) : (
            <div className="size-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-neutral-400">
              {(row.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              {row.name || "Anonymous Believer"}
              {getUserVerificationTier({
                metadata: row.metadata,
                email: row.email,
                name: row.name,
              }) && (
                <VerifiedBadge
                  tier={
                    getUserVerificationTier({
                      metadata: row.metadata,
                      email: row.email,
                      name: row.name,
                    }) || "supporter"
                  }
                  name={row.name}
                  email={row.email}
                  size="sm"
                />
              )}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Current Streak",
      cell: (row) => (
        <span className="font-mono text-red-500 font-bold">
          {/* Streak Medal & Count */}
          {row.currentStreak > 0 && (
            <span className="inline-flex items-end gap-2 text-[10px] font-medium text-neutral-300">
              {renderStreakMedalIcon(row.currentStreak)}
            </span>
          )}{" "}
          {row.currentStreak || 0} Days
        </span>
      ),
    },
    {
      header: "Highest Streak",
      cell: (row) => (
        <span className="font-mono text-neutral-300">
          {row.highestStreak || 0} Days
        </span>
      ),
    },
    {
      header: "Joined Date",
      cell: (row) => (
        <span className="font-mono text-neutral-400 text-[11px]">
          {row.joinedAt ? new Date(row.joinedAt).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setTargetRecipient(row.email);
              setIsBroadcasterOpen(true);
            }}
            title={`Message ${row.name}`}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
          >
            <FaPaperPlane className="size-3 text-red-500" />
          </button>
        </div>
      ),
    },
  ];

  const timeframeLabels: Record<TimeframeFilter, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };

  return (
    <div className="space-y-6 pb-20">
      <SurveyBroadcasterModal
        isOpen={isBroadcasterOpen}
        onClose={() => {
          setIsBroadcasterOpen(false);
          setTargetRecipient(null);
        }}
        recipientCategories={[
          {
            id: "all_users",
            label: "All Registered Users",
            count: users.length,
          },
          ...(targetRecipient
            ? [
                {
                  id: `single_${targetRecipient}`,
                  label: `Direct: ${targetRecipient}`,
                  count: 1,
                },
              ]
            : []),
        ]}
        defaultCategory={
          targetRecipient ? `single_${targetRecipient}` : "all_users"
        }
      />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  relative overflow-hidden">
      {/* Background Red Ambient Soft Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="space-y-1 relative z-10">
        <AppleTypewriterText text={"User Analytics & Activity"}
        className="text-lg xs:text-2xl sm:text-3xl font-black tracking-tight text-white"
        maxLength={25}
        />
        <p className="text-xs sm:text-sm text-neutral-400 font-medium">
          Here is what is happening across your devotional app today.
        </p>
      </div>

      <div className="relative">
          <button
            onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <FaCalendarAlt className="text-red-500 size-3.5" />
            <span>{timeframeLabels[timeframe]}</span>
            <FaChevronDown
              className={`size-3 text-neutral-400 transition-transform ${isTimeframeOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isTimeframeOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-40 overflow-hidden divide-y divide-neutral-800">
              {(["today", "week", "month", "year"] as TimeframeFilter[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeframe(t);
                      setIsTimeframeOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-semibold transition-colors cursor-pointer ${
                      timeframe === t
                        ? "bg-red-950/40 text-white font-bold"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {timeframeLabels[t]}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
    </div>

      {/* Top Header & Global Timeframe Selector Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-950 border border-neutral-900">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <FaUsers className="text-red-500 size-5" /> 
          </h1>
        </div>

        
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              Filtered Users
            </span>
            <FaUsers className="text-neutral-500 size-4" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalUsersCount}
          </div>
          <p className="text-[11px] text-neutral-400">
            Total registered in {timeframeLabels[timeframe].toLowerCase()}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              Active Members
            </span>
            <FaUserCheck className="text-emerald-500 size-4" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {activeUsersCount}
          </div>
          <p className="text-[11px] text-neutral-400">
            Active within the last 48 hours
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">
              New This Month
            </span>
            <FaTrophy className="text-amber-500 size-4" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {newThisMonthCount}
          </div>
          <p className="text-[11px] text-neutral-400">
            Joined during current calendar month
          </p>
        </div>
      </div>

      {/* Recharts Peak Activity Flow Chart */}
      <ActivityPeakChart users={timeframeFilteredUsers} />

      {/* User DataTable & Search Bar */}
      <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-white">Member Directory</h2>
            <p className="text-xs text-neutral-400">
              Click any user row to view complete profile details.
            </p>
          </div>

          <div className="relative sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-3.5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Preloader />
          </div>
        ) : (
          <div
            onClick={(e) => {
              const rowElement = (e.target as HTMLElement).closest("tr");
              if (rowElement && !rowElement.querySelector("button")) {
                // Row clicked - handle deep profile inspection if desired
              }
            }}
          >
            <DataTable
              columns={columns}
              data={tableData}
              emptyMessage="No users found matching current filters."
            />
          </div>
        )}
      </div>

      {/* User Inspection Modal Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end p-0"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-900 p-6 overflow-y-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
                <h3 className="text-base font-black text-white">
                  User Profile Details
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 pt-4">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt=""
                    className="size-20 rounded-full object-cover border-2 border-red-600 shadow-xl"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-2xl font-bold text-white">
                    {(selectedUser.name || "U").charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-bold text-white">
                    {selectedUser.name}
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-900">
                <div className="flex justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                  <span className="text-neutral-400">Current Streak</span>
                  <span className="font-bold text-red-500 font-mono">
                    {selectedUser.currentStreak || 0} Days
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                  <span className="text-neutral-400">Highest Streak</span>
                  <span className="font-bold text-white font-mono">
                    {selectedUser.highestStreak || 0} Days
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                  <span className="text-neutral-400">Account Created</span>
                  <span className="font-bold text-neutral-300 font-mono">
                    {selectedUser.joinedAt
                      ? new Date(selectedUser.joinedAt).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
