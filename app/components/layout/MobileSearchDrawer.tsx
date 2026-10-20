/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiSearch, FiX, FiBookOpen, FiUsers, FiMessageSquare, FiLoader } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, Flame } from "lucide-react";

interface MobileSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchDrawer({ isOpen, onClose }: MobileSearchDrawerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    devotionals: any[];
    users: any[];
    surveys: any[];
  }>({
    devotionals: [],
    users: [],
    surveys: [],
  });

  // Focus input automatically when drawer opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      setResults({ devotionals: [], users: [], surveys: [] });
    }
  }, [isOpen]);

  // Live Backend Search Fetcher
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      setResults({ devotionals: [], users: [], surveys: [] });
      return;
    }

    const fetchTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const [devosRes, usersRes, surveysRes] = await Promise.all([
          fetch("/api/devotionals").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
          fetch("/api/admin/surveys").catch(() => null),
        ]);

        const devosData = devosRes && devosRes.ok ? await devosRes.json() : { devotionals: [] };
        const usersData = usersRes && usersRes.ok ? await usersRes.json() : { users: [] };
        const surveysData = surveysRes && surveysRes.ok ? await surveysRes.json() : { submissions: [] };

        // Filter Devotionals by topic, scripture, or date
        const filteredDevos = (devosData.devotionals || []).filter((d: any) => 
          (d.topic || "").toLowerCase().includes(trimmed) ||
          (d.text || "").toLowerCase().includes(trimmed) ||
          (d.dateString || "").includes(trimmed) ||
          String(d.dayNumber || "").includes(trimmed)
        ).slice(0, 5);

        // Filter Users by name or email
        const filteredUsers = (usersData.users || []).filter((u: any) =>
          (u.name || "").toLowerCase().includes(trimmed) ||
          (u.email || "").toLowerCase().includes(trimmed)
        ).slice(0, 5);

        // Filter Surveys / Feedback by response text or user name
        const filteredSurveys = (surveysData.submissions || []).filter((s: any) => {
          const feedback = s.answers?.helped_walk_with_god || s.answers?.like_most || s.answers?.excites_most || s.answers?.feedback || "";
          return (
            (s.userName || "").toLowerCase().includes(trimmed) ||
            feedback.toLowerCase().includes(trimmed)
          );
        }).slice(0, 5);

        setResults({
          devotionals: filteredDevos,
          users: filteredUsers,
          surveys: filteredSurveys,
        });
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(fetchTimer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const hasResults = 
    results.devotionals.length > 0 || 
    results.users.length > 0 || 
    results.surveys.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Right Slide-in Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-105 bg-black border-l border-neutral-800 shadow-2xl flex flex-col"
          >
            {/* Search Header */}
            <div className="h-16 flex items-center gap-3 px-4 border-b border-neutral-800 shrink-0 bg-neutral-950">
              <FiSearch size={20} className="text-red-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search devotionals, users, feedback..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-neutral-500 font-medium"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-neutral-400 hover:text-white p-1 text-xs font-mono"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
                aria-label="Close search drawer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Results & Suggestions Container */}
            <div className="p-4 space-y-6 overflow-y-auto flex-1 no-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <FiLoader className="w-6 h-6 text-red-600 animate-spin" />
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
                    Searching...
                  </span>
                </div>
              ) : query.trim().length >= 2 ? (
                hasResults ? (
                  <div className="space-y-6">
                    {/* Devotionals Results */}
                    {results.devotionals.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                          <FiBookOpen size={12} /> Devotionals ({results.devotionals.length})
                        </p>
                        <div className="space-y-1.5">
                          {results.devotionals.map((d: any) => (
                            <div
                              key={d.dateString}
                              onClick={() => handleSelect("/admin/dashboard")}
                              className="p-3 rounded-xl bg-neutral-950 border border-white/15 hover:border-neutral-700 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mb-1">
                                <span>Day {d.dayNumber}</span>
                                <span>{d.dateString}</span>
                              </div>
                              <p className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                                {d.topic}
                              </p>
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                {d.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users Results */}
                    {results.users.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                          <FiUsers size={12} /> Users & Streaks ({results.users.length})
                        </p>
                        <div className="space-y-1.5">
                          {results.users.map((u: any) => (
                            <div
                              key={u.id || u.email}
                              onClick={() => handleSelect("/admin/users")}
                              className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-white/15 hover:border-neutral-700 cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-3">
                                {u.avatar_url || u.avatarUrl ? (
                                  <img
                                    src={u.avatar_url || u.avatarUrl}
                                    alt={u.name}
                                    className="w-8 h-8 rounded-full object-cover border border-neutral-800"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                                    {(u.name || "U").charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate max-w-40">
                                    {u.name || "Reader"}
                                  </p>
                                  <p className="text-[10px] text-neutral-500 truncate max-w-40">
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                                <Flame size={12} className="fill-red-500" />
                                <span>{u.currentStreak || u.streak_count || 0}d</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Survey / Feedback Results */}
                    {results.surveys.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                          <FiMessageSquare size={12} /> Community Feedback ({results.surveys.length})
                        </p>
                        <div className="space-y-1.5">
                          {results.surveys.map((s: any) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelect("/admin/feedback")}
                              className="p-3 rounded-xl bg-neutral-950 border border-white/15 hover:border-neutral-700 cursor-pointer transition-all space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">
                                  {s.userName || "Reader"}
                                </span>
                                <span className="text-[10px] font-mono text-amber-500">
                                  ★ {s.overallRating || 5}.0
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-300 italic line-clamp-2">
                                &quot;{s.answers?.helped_walk_with_god || s.answers?.like_most || s.answers?.excites_most || s.answers?.feedback || ""}&quot;
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20 text-neutral-500 text-xs font-mono">
                    No backend results found for &ldquo;{query}&rdquo;
                  </div>
                )
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-3">
                      Quick Suggestions
                    </p>
                    <div className="space-y-2 text-xs">
                      <button 
                        onClick={() => handleSelect("/admin/dashboard")}
                        className="w-full text-left p-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-white/15 text-neutral-300 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span>Manage Devotionals & Articles</span>
                        <span className="text-red-500"><ChevronRight /></span>
                      </button>
                      <button 
                        onClick={() => handleSelect("/admin/users")}
                        className="w-full text-left p-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-white/15 text-neutral-300 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span>View User Streaks & Leaderboard</span>
                        <span className="text-red-500"><ChevronRight /></span>
                      </button>
                      <button 
                        onClick={() => handleSelect("/admin/feedback")}
                        className="w-full text-left p-3 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-neutral-300 cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <span>Review Community Feedback</span>
                        <span className="text-red-500"><ChevronRight /></span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}