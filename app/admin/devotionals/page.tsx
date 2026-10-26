/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiBookOpen,
  FiHeart,
  FiMessageCircle,
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiTrendingUp,
  FiBarChart2,
} from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Preloader from "@/app/components/ui/Preloader";

export default function DevotionalsAdminPage() {
  const router = useRouter();
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingDate, setDeletingDate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch all devotionals and analytics on mount
  useEffect(() => {
    async function fetchDevotionalsAndAnalytics() {
      try {
        setLoading(true);
        const [devosRes, analyticsRes] = await Promise.all([
          fetch("/api/devotionals").catch(() => null),
          fetch("/api/admin/analytics").catch(() => null),
        ]);

        const devosData =
          devosRes && devosRes.ok ? await devosRes.json() : { devotionals: [] };
        const analyticsDataJson =
          analyticsRes && analyticsRes.ok
            ? await analyticsRes.json()
            : { analytics: [] };

        const devosList = devosData.devotionals || [];
        const fetchedAnalytics = analyticsDataJson.analytics || [];

        // Map analytics by dateString for efficient lookup
        const analyticsMap = new Map(
          fetchedAnalytics.map((a: any) => [a.dateString, a]),
        );

        // Merge analytics stats (views, likes, comments) into each devotional item
        const enrichedDevotionals = devosList.map((d: any) => {
          const stats: any = analyticsMap.get(d.dateString) || {};
          return {
            ...d,
            views: stats.views || d.views || 0,
            likes: stats.likes || d.likes || 0,
            comments: stats.comments || d.comments || 0,
          };
        });

        const sorted = enrichedDevotionals.sort((a: any, b: any) =>
          b.dateString.localeCompare(a.dateString),
        );
        setDevotionals(sorted);
      } catch (err) {
        console.error("Failed to load devotionals or analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevotionalsAndAnalytics();
  }, []);
  // Compute stats
  const totalCount = devotionals.length;
  const currentMonthStr = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const thisMonthCount = devotionals.filter((d) =>
    d.dateString?.startsWith(currentMonthStr),
  ).length;
  const totalViews = devotionals.reduce((acc, d) => acc + (d.views || 0), 0);
  const totalLikes = devotionals.reduce((acc, d) => acc + (d.likes || 0), 0);

  const filteredDevotionals = devotionals.filter(
    (d) =>
      (d.topic || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.text || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.dateString || "").includes(searchQuery) ||
      String(d.dayNumber || "").includes(searchQuery),
  );

  const handleConfirmDelete = async () => {
    if (!deletingDate) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/devotionals/${deletingDate}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setDevotionals((prev) =>
        prev.filter((d) => d.dateString !== deletingDate),
      );
      setMessage({
        type: "success",
        text: `Devotional for ${deletingDate} successfully deleted.`,
      });
      setDeletingDate(null);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Deletion failed." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate next sequential date based on loaded devotionals
  const getNextDevotionalDate = () => {
    if (!devotionals || devotionals.length === 0) {
      return new Date().toISOString().slice(0, 10);
    }
    // Sort descending to find the latest date string
    const sorted = [...devotionals].sort((a: any, b: any) =>
      (b.dateString || "").localeCompare(a.dateString || ""),
    );
    const latestDateStr = sorted[0].dateString;
    const parts = latestDateStr.split("-");
    if (parts.length === 3) {
      const nextDate = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10) + 1,
      );
      if (!isNaN(nextDate.getTime())) {
        return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
      }
    }
    return new Date().toISOString().slice(0, 10);
  };

  const nextDateStr = getNextDevotionalDate();

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FiBookOpen className="text-primary size-6" /> Devotional Management
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create, schedule, edit, and track engagement for all published
            devotionals.
          </p>
        </div>

        <Link
          href={`/admin/devotionals/edit?date=${nextDateStr}`}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-primary active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all cursor-pointer w-fit"
        >
          <FiPlus size={16} />
          <span>Add Devotional</span>
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Devotionals
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalCount}</span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              Published
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Created This Month
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {thisMonthCount}
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-800/50 flex items-center gap-1">
              <FiTrendingUp size={10} /> Active
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Views
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {totalViews.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/50">
              Readers
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Total Likes
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">
              {totalLikes.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/50">
              Engagement
            </span>
          </div>
        </div>
      </div>

      {/* Success/Error Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                : "bg-red-950/20 border-red-800/40 text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-4" />
          <input
            type="text"
            placeholder="Search by topic, scripture, or date (YYYY-MM-DD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400">
          Showing{" "}
          <span className="text-white font-bold">
            {filteredDevotionals.length}
          </span>{" "}
          entries
        </div>
      </div>

      {/* Devotionals Table */}
      <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 space-y-4">
        {loading ? (
          <div className=" h-24 w-full flex items-center justify-center">
            <Preloader />
          </div>
        ) : filteredDevotionals.length === 0 ? (
          <div className="py-20 text-center text-xs text-neutral-500 space-y-2">
            <p>No devotionals found matching your query.</p>
            <Link
              href={`/admin/devotionals/edit?date=${nextDateStr}`}
              className="text-primary underline font-semibold"
            >
              Create your first devotional for today →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 uppercase font-mono tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Day / Date</th>
                  <th className="pb-3 px-3">Topic Title</th>
                  <th className="pb-3 px-3">Scripture</th>
                  <th className="pb-3 px-3 text-right">Engagement</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {filteredDevotionals.map((d) => (
                  <tr
                    key={d.dateString}
                    className="hover:bg-neutral-900/40 transition-colors group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/admin/devotionals/edit?date=${d.dateString}`,
                      )
                    }
                  >
                    <td className="py-4 px-3 font-mono">
                      <span className="text-white font-bold block">
                        Day {d.dayNumber}
                      </span>
                      <span className="text-neutral-500 text-[10px] flex items-center gap-1 mt-0.5 whitespace-nowrap">
                        <FiCalendar size={10} /> {d.dateString}
                      </span>
                    </td>
                    <td className="py-4 px-3 font-bold text-neutral-200 group-hover:text-red-400 transition-colors whitespace-nowrap">
                      {d.topic}
                    </td>
                    <td className="py-4 px-3 text-neutral-400 italic whitespace-nowrap">
                      {d.text}
                    </td>
                    <td className="py-4 px-3 text-right font-mono text-neutral-400">
                      <div className="flex items-center justify-end gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <FiBarChart2 className="text-neutral-500" />{" "}
                          {d.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiHeart className="text-primary" /> {d.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMessageCircle className="text-amber-500" />{" "}
                          {d.comments || 0}
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-4 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/devotionals/edit?date=${d.dateString}`}
                          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                          title="Edit devotional"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeletingDate(d.dateString)}
                          className="p-2 rounded-xl bg-neutral-900 hover:bg-red-950/40 text-neutral-300 hover:text-primary transition-colors"
                          title="Delete devotional"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-neutral-950 border border-white/15 shadow-2xl text-left space-y-4"
            >
              <h4 className="text-base font-bold text-white">
                Delete Devotional
              </h4>
              <p className="text-xs text-neutral-400">
                Are you sure you want to permanently delete the devotional for{" "}
                <span className="text-white font-mono font-bold">
                  {deletingDate}
                </span>
                ? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDate(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-primary text-white"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
