/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import { FaChartLine } from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface ActivityPeakChartProps {
  users: Array<{
    lastActiveDate?: string;
    joinedAt?: string;
    [key: string]: any;
  }>;
}

export function ActivityPeakChart({ users }: ActivityPeakChartProps) {
  // Process real user data into 24 hourly buckets (00:00 to 23:00)
  const chartData = useMemo(() => {
    const hoursCount = Array(24).fill(0);

    users.forEach((user) => {
      // Use lastActiveDate or fallback to joinedAt
      const timestamp = user.lastActiveDate || user.joinedAt;
      if (timestamp) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const hour = date.getHours(); // 0 - 23
          hoursCount[hour] += 1;
        }
      }
    });

    // Format for Recharts
    return hoursCount.map((count, index) => {
      let label = "";
      if (index === 0) label = "12 AM";
      else if (index < 12) label = `${index} AM`;
      else if (index === 12) label = "12 PM";
      else label = `${index - 12} PM`;

      return {
        hour: label,
        rawHour: index,
        activeUsers: count,
      };
    });
  }, [users]);

  // Find peak hour description
  const peakHourObj = useMemo(() => {
    if (!chartData.length) return { hour: "12 PM", activeUsers: 0 };
    return [...chartData].reduce((max, current) => 
      current.activeUsers > max.activeUsers ? current : max
    , chartData[0]);
  }, [chartData]);

  return (
    <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FaChartLine className="text-red-500 size-4" /> Real-Time Daily Activity Flow (Peak Hours)
          </h3>
          <p className="text-xs text-neutral-400">Based on actual user sign-in and activity timestamps.</p>
        </div>
        <span className="text-[10px] font-mono bg-red-950/40 text-red-400 px-2.5 py-1 rounded-full border border-red-800/40 w-fit">
          Peak: {peakHourObj.hour} ({peakHourObj.activeUsers} logins)
        </span>
      </div>

      <div className="w-full h-48 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="realRedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#262626" }}
              interval={3}
            />
            <YAxis
              stroke="#737373"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl text-xs space-y-1">
                      <p className="font-bold text-white">{label}</p>
                      <p className="text-red-400 font-mono font-bold">
                        {payload[0].value} Active Users
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="activeUsers"
              stroke="#ef4444"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#realRedGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}