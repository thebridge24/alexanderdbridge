/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import {
  FiPieChart,
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiChevronDown,
} from "react-icons/fi";
import { DataTable, Column } from "../components/DataTable";
import { Dropdown } from "@/app/components/ui/Dropdown";
import { formatDate } from "@/lib/format-date";
import AddIncomeModal from "../components/AddIncomeModal";
import AddExpenseModal from "../components/AddExpenseModal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Users } from "lucide-react";

export interface FinanceRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  narration?: string;
  date: string;
  source?: string;
}

type TimeFilterOption = "all" | "week" | "month" | "year" | "custom";

export default function FinancesAdminPage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const fetchFinances = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/finances");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load finances:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  // Filter logic
  const filterByDate = (dateStr: string) => {
    if (timeFilter === "all") return true;
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (timeFilter === "month") {
      return (
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear()
      );
    }
    if (timeFilter === "year") {
      return itemDate.getFullYear() === now.getFullYear();
    }
    if (timeFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    }
    if (timeFilter === "custom") {
      if (!customStartDate && !customEndDate) return true;
      const start = customStartDate ? new Date(customStartDate) : new Date(0);
      const end = customEndDate
        ? new Date(customEndDate)
        : new Date(8640000000000000);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }
    return true;
  };

  const filteredRecords = records.filter((r) => filterByDate(r.date));

  const totalIncome = filteredRecords
    .filter((r) => r.type === "income")
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalExpenses = filteredRecords
    .filter((r) => r.type === "expense")
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const netBalance = totalIncome - totalExpenses;

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "week":
        return "This Week (Sun+)";
      case "month":
        return "This Month";
      case "year":
        return "This Year";
      case "custom":
        return "Custom Range";
      default:
        return "All Time";
    }
  };
  // Prepare Recharts chart data grouped by formatted readable dates
  const chartDataMap: Record<
    string,
    { date: string; displayDate: string; income: number; expense: number }
  > = {};

  filteredRecords.forEach((r) => {
    const rawDate = r.date || "2026-01-01";

    // Format date nicely (e.g., "May 14" or "Oct 28")
    const parsedDate = new Date(rawDate);
    const displayDate = isNaN(parsedDate.getTime())
      ? rawDate
      : parsedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

    if (!chartDataMap[rawDate]) {
      chartDataMap[rawDate] = {
        date: rawDate,
        displayDate,
        income: 0,
        expense: 0,
      };
    }
    if (r.type === "income") chartDataMap[rawDate].income += r.amount;
    if (r.type === "expense") chartDataMap[rawDate].expense += r.amount;
  });

  const chartData = Object.values(chartDataMap).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const columns: Column<FinanceRecord>[] = [
    {
      header: "Title & Narration",
      className: "min-w-[220px]",
      cell: (row) => (
        <div>
          <span className="font-bold text-white block">{row.title}</span>
          <span className="text-[11px] text-neutral-400 block truncate max-w-xs">
            {row.narration || "No narration provided."}
          </span>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (row) => (
        <span className="text-xs font-mono text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
          {row.category}
        </span>
      ),
    },
    {
      header: "Type",
      cell: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border uppercase ${
            row.type === "income"
              ? "bg-emerald-950/80 text-white border-emerald-800/50"
              : "bg-red-950/80 text-red-400 border-red-800/50"
          }`}
        >
          {row.type}
        </span>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span
          className={`font-mono font-bold ${
            row.type === "income" ? "text-white" : "text-red-400"
          }`}
        >
          {row.type === "income" ? "+" : "-"}₦
          {(Number(row.amount) || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (row) => (
        <span className="font-mono text-neutral-300 flex items-center gap-1">
          <FiCalendar size={12} className="text-neutral-500" />{" "}
          {formatDate(row.date)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FiPieChart className="text-primary size-6" /> Income & Expenses
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Automated subscription revenue logging paired with manual expense &
            income tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <FiFilter className="text-primary size-3.5" />
                <span>{getTimeFilterLabel()}</span>
                <FiChevronDown className="size-3.5 text-neutral-400 ml-1" />
              </button>
            }
          >
            <div className="p-2 space-y-1 w-52">
              <button
                onClick={() => setTimeFilter("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "all"
                    ? "bg-red-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter("week")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "week"
                    ? "bg-red-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Week (Sun - Sat)
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "month"
                    ? "bg-red-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter("year")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "year"
                    ? "bg-red-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Year
              </button>
              <button
                onClick={() => setTimeFilter("custom")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "custom"
                    ? "bg-red-600 text-white"
                    : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Custom Range
              </button>
            </div>
          </Dropdown>

          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white hover:opacity-75 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
          >
            <FiPlus size={16} />
            <span>Add Income</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all cursor-pointer"
          >
            <FiPlus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Custom Date Inputs Drawer */}
      {timeFilter === "custom" && (
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold uppercase text-neutral-400 font-mono">
            Custom Range:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-neutral-500 font-mono">
              From:
            </label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-neutral-500 font-mono">
              To:
            </label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary font-mono"
            />
          </div>
        </div>
      )}

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Income
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/40">
              <FiTrendingUp size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            ₦{totalIncome.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2.5 rounded-2xl bg-red-950/30 text-red-400 border border-red-800/40">
              <FiTrendingDown size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-red-400 font-mono">
            ₦{totalExpenses.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Net Balance
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-950/30 text-blue-400 border border-blue-800/40">
              <FiDollarSign size={18} />
            </div>
          </div>
          <div
            className={`text-3xl font-black font-mono ${netBalance >= 0 ? "text-white" : "text-red-400"}`}
          >
            ₦{netBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Total Records
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/40">
              <Users size={18} />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono">
           {filteredRecords.length}
          </div>
        </div>
      </div>

      {/* Dual Recharts Gradient Chart (Green Income vs Red Expenses) */}
      <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Financial Flow Overview
            </h3>
            <p className="text-xs text-neutral-400">
              Comparing income growth against operational expenses
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
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis
                dataKey="displayDate"
                stroke="#737373"
                fontSize={11}
                tickLine={false}
              />
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

      {/* Transactions Table */}
      <DataTable<FinanceRecord>
        columns={columns}
        data={filteredRecords}
        isLoading={loading}
        emptyMessage="No financial records found for this period."
      />

      {/* Modals */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={fetchFinances}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={fetchFinances}
      />
    </div>
  );
}
