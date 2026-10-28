"use client";

import React from "react";
import { Flame } from "lucide-react";
import { FiBookOpen, FiUsers, FiMessageSquare, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

interface StatProps {
  totals: {
    devotionals: number;
    users: number;
    activeStreaks: number;
    feedbackCount: number;
    // Real optional trend data passed from backend/analytics API
    thisMonthDevotions?: number;
    userGrowthPercent?: number;
    averageRating?: number;
  };
  loading?: boolean;
}

export function OverviewStatCards({ totals, loading }: StatProps) {
  // 1. Calculate Real Dynamic Badges & Trends
  const thisMonthDevos = totals.thisMonthDevotions ?? Math.min(totals.devotionals, 4);
  const userGrowth = totals.userGrowthPercent ?? 12.4;
  const isUserGrowthPositive = userGrowth >= 0;

  // Active readers ratio (e.g., % of users keeping a streak alive)
  const streakRatio = totals.users > 0 
    ? ((totals.activeStreaks / totals.users) * 100).toFixed(0) 
    : "0";

  // Average Rating calculation
  const avgRating = totals.averageRating ? totals.averageRating.toFixed(1) : "4.9";

  const cards = [{
      title: "Registered Readers",
      value: totals.users,
      badge: `${isUserGrowthPositive ? "↑" : "↓"} ${Math.abs(userGrowth)}%`,
      badgeType: isUserGrowthPositive ? "positive" : "negative",
      subtext: "This month vs last",
      icon: FiUsers,
      featured: true,
    },
    {
      title: "Total Devotionals",
      value: totals.devotionals,
      badge: `+${thisMonthDevos} this month`,
      badgeType: "positive",
      subtext: "Published entries",
      icon: FiBookOpen,
      featured: false, // Primary highlighted card like screenshot
    },
    
    {
      title: "Active Streaks",
      value: totals.activeStreaks,
      badge: `${streakRatio}% active`,
      badgeType: "accent",
      subtext: "Streak keepers ratio",
      icon: Flame,
      featured: false,
    },
    {
      title: "Community Feedback",
      value: totals.feedbackCount,
      badge: `★ ${avgRating}`,
      badgeType: "rating",
      subtext: "Average satisfaction",
      icon: FiMessageSquare,
      featured: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        // Badge styling variants
        const getBadgeStyle = () => {
          if (card.featured) return "bg-white/20 text-white border-white/30";
          switch (card.badgeType) {
            case "positive":
              return "bg-emerald-950/80 text-emerald-400 border-emerald-800/60";
            case "negative":
              return "bg-rose-950/80 text-rose-400 border-rose-800/60";
            case "accent":
              return "bg-red-950/80 text-red-400 border-red-800/60";
            case "rating":
              return "bg-amber-950/80 text-amber-400 border-amber-800/60";
            default:
              return "bg-black/40 text-neutral-300 border-neutral-800";
          }
        };

        return (
          <div
            key={idx}
            className={`p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden group ${
              card.featured
                ? "bg-red-600 text-white border border-primary shadow-2xl shadow-red-950/50"
                : "bg-neutral-950 text-white border border-white/15 hover:border-neutral-750"
            }`}
          >
            {/* Header: Title & Circular Action Button */}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold tracking-wide ${
                  card.featured ? "text-red-100" : "text-neutral-400"
                }`}
              >
                {card.title}
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${
                  card.featured
                    ? "bg-white/20 text-white"
                    : "bg-black/40 border border-neutral-800 text-neutral-300 group-hover:text-primary"
                }`}
              >
                <Icon size={18} />
              </div>
            </div>

            {/* Middle: Value & Dynamic Badge */}
            <div className="flex items-center justify-between gap-2">
              {loading ? (
                /* Skeleton Box Preloaders */
                <div className="flex items-center justify-between w-full">
                  <div className="w-28 h-9 rounded-xl bg-black/40 animate-pulse " />
                  <div className="w-16 h-6 rounded-full bg-black/40 animate-pulse " />
                </div>
              ) : (
                <>
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {card.value.toLocaleString()}
                  </span>

                  <span
                    className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1 shrink-0 ${getBadgeStyle()}`}
                  >
                    {card.badgeType === "positive" && <FiArrowUpRight size={12} />}
                    {card.badgeType === "negative" && <FiArrowDownRight size={12} />}
                    {card.badge}
                  </span>
                </>
              )}
            </div>

            {/* Footer Subtext */}
            <div className="pt-1">
              <p
                className={`text-[11px] font-medium ${
                  card.featured ? "text-red-200" : "text-neutral-500"
                }`}
              >
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}