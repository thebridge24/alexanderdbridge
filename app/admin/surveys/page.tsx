"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Eye, Search, ArrowUpDown, Filter, CheckCircle2 } from "lucide-react";

// Mock submission type mirroring survey answers structure
export interface SurveySubmission {
  id: string;
  userName?: string;
  userEmail?: string;
  submittedAt: string;
  overallRating: number;
  answers: Record<string, any>;
}

export default function SurveySubmissionsPage() {
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
    ? (submissions.reduce((acc, item) => acc + item.overallRating, 0) / totalSubmissions).toFixed(1)
    : "–";

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
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Willingness to Pay</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-neutral-900/40 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{sub.userName || "Anonymous"}</div>
                        <div className="text-[11px] text-neutral-500">{sub.userEmail || sub.id}</div>
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
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono capitalize ${
                            sub.answers.membership_willingness === "yes_definitely"
                              ? "bg-emerald-950/60 border border-emerald-800 text-emerald-400"
                              : sub.answers.membership_willingness === "maybe"
                              ? "bg-amber-950/60 border border-amber-800 text-amber-400"
                              : "bg-neutral-900 border border-neutral-800 text-neutral-400"
                          }`}
                        >
                          {sub.answers.membership_willingness?.replace("_", " ") || "N/A"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                        {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Action View Button */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/surveys/${sub.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-red-600/20 hover:border-red-600/50 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg transition-all text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-500 text-xs">
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
