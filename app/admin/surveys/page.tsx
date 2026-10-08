"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Star, Search, Filter, PieChart as PieIcon } from "lucide-react";

// Mock submission type mirroring survey answers structure
export interface SurveySubmission {
  id: string;
  userName?: string;
  userEmail?: string;
  submittedAt: string;
  overallRating: number;
  answers: Record<string, any>;
}

// Config for Willingness categories & colors
const WILLINGNESS_CONFIG: Record<
  string,
  { label: string; color: string; badgeClass: string }
> = {
  yes_definitely: {
    label: "Yes, Definitely",
    color: "#10b981", // Emerald-500
    badgeClass: "bg-emerald-950/60 border-emerald-800 text-emerald-400",
  },
  maybe: {
    label: "Maybe",
    color: "#f59e0b", // Amber-500
    badgeClass: "bg-amber-950/60 border-amber-800 text-amber-400",
  },
  no: {
    label: "No / Unwilling",
    color: "#ef4444", // Red-500
    badgeClass: "bg-red-950/60 border-red-800 text-red-400",
  },
  other: {
    label: "Unspecified / N/A",
    color: "#6b7280", // Neutral-500
    badgeClass: "bg-neutral-900 border-neutral-800 text-neutral-400",
  },
};

// Pure SVG Pie Chart Component
function WillingnessPieChart({
  data,
  total,
}: {
  data: { key: string; label: string; count: number; color: string }[];
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-neutral-800 flex items-center justify-center text-[10px] text-neutral-600 font-mono">
        No Data
      </div>
    );
  }

  let cumulativePercent = 0;

  // Convert slice coordinates for SVG <path>
  const slices = data.map((slice) => {
    const percent = slice.count / total;
    const startAngle = cumulativePercent * 2 * Math.PI;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 2 * Math.PI;

    // Handle 100% single slice edge case
    if (percent === 1) {
      return {
        ...slice,
        percent,
        pathData: "M 0 -1 A 1 1 0 1 1 0 0.999 Z",
      };
    }

    const x1 = Math.sin(startAngle);
    const y1 = -Math.cos(startAngle);
    const x2 = Math.sin(endAngle);
    const y2 = -Math.cos(endAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;
    const pathData = `M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return { ...slice, percent, pathData };
  });

  return (
    <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full -rotate-90 transform">
        {slices.map(
          (s) =>
            s.count > 0 && (
              <path
                key={s.key}
                d={s.pathData}
                fill={s.color}
                className="transition-all duration-300 hover:opacity-80"
              />
            )
        )}
      </svg>
      {/* Inner Ring Overlay for Donut Effect */}
      <div className="absolute inset-0 m-auto w-16 h-16 bg-neutral-950 rounded-full border border-neutral-800/80 flex flex-col items-center justify-center shadow-inner">
        <span className="text-xs font-bold text-white font-mono">{total}</span>
        <span className="text-[9px] text-neutral-500 uppercase tracking-tighter">
          Users
        </span>
      </div>
    </div>
  );
}

export default function SurveySubmissionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/surveys")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load responses");
        if (!cancelled) setSubmissions(json.submissions ?? []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute breakdown metrics for Pie Chart
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {
      yes_definitely: 0,
      maybe: 0,
      no: 0,
      other: 0,
    };

    submissions.forEach((sub) => {
      const val = sub.answers?.membership_willingness;
      if (val === "yes_definitely") counts.yes_definitely++;
      else if (val === "maybe") counts.maybe++;
      else if (val === "no" || val === "not_interested") counts.no++;
      else counts.other++;
    });

    return [
      {
        key: "yes_definitely",
        label: WILLINGNESS_CONFIG.yes_definitely.label,
        count: counts.yes_definitely,
        color: WILLINGNESS_CONFIG.yes_definitely.color,
      },
      {
        key: "maybe",
        label: WILLINGNESS_CONFIG.maybe.label,
        count: counts.maybe,
        color: WILLINGNESS_CONFIG.maybe.color,
      },
      {
        key: "no",
        label: WILLINGNESS_CONFIG.no.label,
        count: counts.no,
        color: WILLINGNESS_CONFIG.no.color,
      },
      {
        key: "other",
        label: WILLINGNESS_CONFIG.other.label,
        count: counts.other,
        color: WILLINGNESS_CONFIG.other.color,
      },
    ];
  }, [submissions]);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (sub.userEmail?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === "all" ? true : sub.overallRating === Number(ratingFilter);

    return matchesSearch && matchesRating;
  });

  const totalSubmissions = submissions.length;
  const avgRating = totalSubmissions
    ? (
        submissions.reduce((acc, item) => acc + item.overallRating, 0) /
        totalSubmissions
      ).toFixed(1)
    : "–";

  const formatPrice = (amount?: string | number) => {
    if (!amount || amount === "keep_free") return "Keep Free";
    const num = Number(amount);
    if (isNaN(num)) return String(amount);
    return `₦${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-red-500">
              Admin Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
              Devotional Survey Responses
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Review feedback and feature requests from platform members.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                Total Feedback
              </span>
              <span className="text-lg font-bold text-white">{totalSubmissions}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] font-mono text-neutral-500 uppercase block">
                Avg Rating
              </span>
              <span className="text-lg font-bold text-red-500 flex items-center justify-center gap-1">
                {avgRating} <Star className="w-3.5 h-3.5 fill-red-500" />
              </span>
            </div>
          </div>
        </div>

        {loading && <p className="text-sm text-neutral-500">Loading responses...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Decision Analytics Pie Chart Widget */}
        {!loading && !error && (
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-red-500" />
                <h2 className="text-sm font-semibold tracking-wide text-white">
                  User Membership Decision Breakdown
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Willingness Distribution
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
              {/* Pie Chart SVG Render */}
              <WillingnessPieChart data={breakdown} total={totalSubmissions} />

              {/* Chart Legend Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {breakdown.map((item) => {
                  const percentage = totalSubmissions
                    ? Math.round((item.count / totalSubmissions) * 100)
                    : 0;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-neutral-300 font-medium">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-xs font-bold text-white">
                          {item.count}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, email, or ID..."
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-600 focus:ring-1 focus:ring-red-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          {/* Rating Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs text-neutral-400">Rating:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 focus:border-red-600 text-xs rounded-xl px-3 py-2 text-neutral-300 outline-none transition-all"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] font-mono text-neutral-400 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Willingness</th>
                  <th className="py-3.5 px-4">Agreed Price</th>
                  <th className="py-3.5 px-4 text-right">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((sub) => {
                    const willingnessKey =
                      sub.answers?.membership_willingness || "other";
                    const config =
                      WILLINGNESS_CONFIG[willingnessKey] ||
                      WILLINGNESS_CONFIG.other;

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => router.push(`/admin/surveys/${sub.id}`)}
                        className="hover:bg-neutral-900/60 transition-colors cursor-pointer group whitespace-nowrap"
                      >
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white group-hover:text-red-400 transition-colors">
                            {sub.userName || "Anonymous"}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {sub.userEmail || sub.id}
                          </div>
                        </td>

                        {/* Overall Rating */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 font-semibold text-white">
                            <span>{sub.overallRating}</span>
                            <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                          </div>
                        </td>

                        {/* Support Willingness */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono capitalize border ${config.badgeClass}`}
                          >
                            {config.label}
                          </span>
                        </td>

                        {/* Agreed Price */}
                        <td className="py-3.5 px-4 font-mono text-neutral-200">
                          {formatPrice(sub.answers.monthly_amount)}
                        </td>

                        {/* Date Submitted */}
                        <td className="py-3.5 px-4 text-right text-neutral-400 font-mono text-[11px]">
                          {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-neutral-500 text-xs whitespace-nowrap"
                    >
                      No survey responses found matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
