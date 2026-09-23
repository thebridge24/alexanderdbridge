/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaArrowCircleUp,
  FaArrowCircleDown,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type DevotionalAnalyticsItem = {
  dateString: string; // Expected format: YYYY-MM-DD
  topic: string;
  dayNumber: number;
  displayDate: string;
  views: number;
  likes: number;
  comments: number;
};

interface AnalyticsSectionProps {
  analyticsData: DevotionalAnalyticsItem[];
  analyticsTotals: { views: number; likes: number; comments: number };
  analyticsLoading: boolean;
}

type Granularity = "daily" | "weekly" | "monthly";

type ProcessedAnalyticsItem = {
  key: string;
  displayLabel: string;
  views: number;
  likes: number;
  comments: number;
  count: number;
};

// Custom Studio Tooltip component
const CustomTooltip = ({ active, payload, metric }: any) => {
  if (active && payload && payload.length) {
    const data: ProcessedAnalyticsItem = payload[0].payload;
    return (
      <div className="px-3.5 py-2.5 rounded-xl bg-neutral-950/90 backdrop-blur-md border border-neutral-800 text-xs text-neutral-200 shadow-2xl space-y-1 z-50">
        <p className="font-semibold text-white">{data.displayLabel}</p>
        <p className="text-neutral-500 text-[10px]">
          Entries grouped: <span className="text-neutral-300 font-medium">{data.count}</span>
        </p>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-900">
          <span className="capitalize text-neutral-400">{metric}:</span>
          <span className="font-mono font-bold text-red-500">
            {data[metric as keyof ProcessedAnalyticsItem].toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function AnalyticsSection({
  analyticsData,
  analyticsTotals,
  analyticsLoading,
}: AnalyticsSectionProps) {
  const [analyticsMetric, setAnalyticsMetric] = useState<
    "views" | "likes" | "comments"
  >("views");

  const [timeframe, setTimeframe] = useState<Granularity>("monthly");

  // Dynamically group data based on selected timeframe (Daily, Weekly, or Monthly)
  const chartData = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return [];

    const map = new Map<string, ProcessedAnalyticsItem>();

    analyticsData.forEach((item) => {
      const parts = item.dateString.split("-");
      if (parts.length < 3) return;

      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);

      let key = "";
      let displayLabel = "";

      if (timeframe === "daily") {
        key = item.dateString;
        displayLabel = isNaN(dateObj.getTime())
          ? item.displayDate || item.dateString
          : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (timeframe === "weekly") {
        // Calculate week index or start of week
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (dateObj.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = `${year}-W${weekNum < 10 ? "0" + weekNum : weekNum}`;
        displayLabel = `W${weekNum}, ${year}`;
      } else {
        // Monthly
        const monthKey = `${parts[0]}-${parts[1]}`;
        key = monthKey;
        displayLabel = isNaN(dateObj.getTime())
          ? monthKey
          : dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      }

      if (!map.has(key)) {
        map.set(key, {
          key,
          displayLabel,
          views: 0,
          likes: 0,
          comments: 0,
          count: 0,
        });
      }

      const existing = map.get(key)!;
      existing.views += item.views || 0;
      existing.likes += item.likes || 0;
      existing.comments += item.comments || 0;
      existing.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [analyticsData, timeframe]);

  // Format large numbers (e.g. 3.0K, 1.2M)
  const formatStatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-[#09090b] border border-neutral-900 shadow-2xl overflow-hidden font-sans text-neutral-200"
    >
      {/* Top Header Controls: Timeframe Granularity Selector */}
      <div className="p-4 border-b border-neutral-900 bg-[#000000] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
          <FaCalendarAlt className="text-red-500 size-3.5" /> Analytics
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-950 border border-neutral-900">
          {(["daily", "weekly", "monthly"] as Granularity[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTimeframe(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                timeframe === mode
                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* YouTube Studio Stat Selector Tabs */}
      <div className="grid grid-cols-3 border-b border-neutral-900 bg-[#09090b]">
        {/* Views Tab */}
        <button
          type="button"
          onClick={() => setAnalyticsMetric("views")}
          className={`relative p-5 text-center flex flex-col items-center justify-center transition-all cursor-pointer border-r border-neutral-900 ${
            analyticsMetric === "views"
              ? "bg-[#121212] border-t-2 border-t-red-600"
              : "hover:bg-[#0f0f0f] border-t-2 border-t-transparent"
          }`}
        >
          <span className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wider">
            Total Views
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {formatStatNumber(analyticsTotals.views)}
            </span>
            <FaCheckCircle className="text-red-500 size-4" />
          </div>
          <span className="text-[11px] text-neutral-500 italic">Steady activity</span>
        </button>

        {/* Likes Tab */}
        <button
          type="button"
          onClick={() => setAnalyticsMetric("likes")}
          className={`relative p-5 text-center flex flex-col items-center justify-center transition-all cursor-pointer border-r border-neutral-900 ${
            analyticsMetric === "likes"
              ? "bg-[#121212] border-t-2 border-t-red-600"
              : "hover:bg-[#0f0f0f] border-t-2 border-t-transparent"
          }`}
        >
          <span className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wider">
            Total Likes
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {formatStatNumber(analyticsTotals.likes)}
            </span>
            <FaArrowCircleUp className="text-red-500 size-4" />
          </div>
          <span className="text-[11px] text-neutral-500 italic">+12% vs last period</span>
        </button>

        {/* Comments Tab */}
        <button
          type="button"
          onClick={() => setAnalyticsMetric("comments")}
          className={`relative p-5 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
            analyticsMetric === "comments"
              ? "bg-[#121212] border-t-2 border-t-red-600"
              : "hover:bg-[#0f0f0f] border-t-2 border-t-transparent"
          }`}
        >
          <span className="text-xs text-neutral-500 font-medium mb-1 uppercase tracking-wider">
            Comments
          </span>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {formatStatNumber(analyticsTotals.comments)}
            </span>
            <FaArrowCircleDown className="text-neutral-600 size-4" />
          </div>
          <span className="text-[11px] text-neutral-500 italic">5% less than usual</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="p-6 bg-[#09090b] ">
        {analyticsLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-neutral-600">
            Loading analytics data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-neutral-600">
            No devotional analytics recorded for this period.
          </div>
        ) : (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  {/* Glowing Red Linear Gradient */}
                  <linearGradient id="redAccentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#171717"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayLabel"
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#171717" }}
                  dy={10}
                />
                <YAxis
                  orientation="right"
                  stroke="#525252"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) =>
                    val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val
                  }
                  dx={10}
                />
                <Tooltip
                  cursor={{ stroke: "#404040", strokeDasharray: "2 2" }}
                  content={<CustomTooltip metric={analyticsMetric} />}
                />
                <Area
                  type="monotone"
                  dataKey={analyticsMetric}
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#redAccentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}