"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FinanceRecord } from "../finances/page";

interface FinanceChartProps {
  records: FinanceRecord[];
}

export default function FinanceChart({ records }: FinanceChartProps) {
  // Normalize date into strict YYYY-MM-DD calendar day key
  const getNormalizedDateKey = (dateStr: string) => {
    if (!dateStr) return "2026-01-01";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Group strictly per calendar day
  const chartDataMap: Record<
    string,
    { dateKey: string; displayDate: string; income: number; expense: number }
  > = {};

  records.forEach((r) => {
    const dateKey = getNormalizedDateKey(r.date);
    const parsedDate = new Date(dateKey);
    const displayDate = isNaN(parsedDate.getTime())
      ? dateKey
      : parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

    if (!chartDataMap[dateKey]) {
      chartDataMap[dateKey] = {
        dateKey,
        displayDate,
        income: 0,
        expense: 0,
      };
    }

    if (r.type === "income") chartDataMap[dateKey].income += Number(r.amount) || 0;
    if (r.type === "expense") chartDataMap[dateKey].expense += Number(r.amount) || 0;
  });

  const chartData = Object.values(chartDataMap).sort((a, b) =>
    a.dateKey.localeCompare(b.dateKey)
  );

  return (
    <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Financial Flow Overview</h3>
          <p className="text-xs text-neutral-400">
            Comparing daily income growth against operational expenses
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-white">
            <span className="size-2 rounded-full bg-emerald-500" /> Income
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="size-2 rounded-full bg-red-500" /> Expenses
          </span>
        </div>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="displayDate" stroke="#737373" fontSize={11} tickLine={false} />
            <YAxis stroke="#737373" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0a0a",
                borderColor: "#262626",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#incomeGradient)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}