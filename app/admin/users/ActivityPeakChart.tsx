"use client";

import React, { useState, useEffect, useMemo } from "react";
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

export function ActivityPeakChart() {
  const [chartData, setChartData] = useState<Array<{ hour: string; rawHour: number; visits: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVisitorTraffic() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          const traffic: number[] = data.hourlyTraffic || Array(24).fill(0);

          const formatted = traffic.map((count, index) => {
            let label = "";
            if (index === 0) label = "12 AM";
            else if (index < 12) label = `${index} AM`;
            else if (index === 12) label = "12 PM";
            else label = `${index - 12} PM`;

            return {
              hour: label,
              rawHour: index,
              visits: count,
            };
          });

          setChartData(formatted);
        }
      } catch (err) {
        console.error("Failed to load visitor peak chart data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitorTraffic();
  }, []);

  const peakHourObj = useMemo(() => {
    if (!chartData.length) return { hour: "12 PM", visits: 0 };
    return [...chartData].reduce((max, current) => 
      current.visits > max.visits ? current : max
    , chartData[0]);
  }, [chartData]);

  return (
    <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-900 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FaChartLine className="text-primary size-4" /> Visitors Traffic Analysis (Peak Hours per Day)
          </h3>
          <p className="text-xs text-neutral-400">Track when members visit the platform most across 24 hours.</p>
        </div>
        <span className="text-[10px] font-mono bg-red-950/40 text-red-400 px-2.5 py-1 rounded-full border border-red-800/40 w-fit">
          Peak Traffic: {peakHourObj.hour} ({peakHourObj.visits} visits)
        </span>
      </div>

      <div className="w-full h-48 pt-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-neutral-500">
            Analyzing traffic peaks...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="visitorRedGradient" x1="0" y1="0" x2="0" y2="1">
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
                          {payload[0].value} Visits Recorded
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#visitorRedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}