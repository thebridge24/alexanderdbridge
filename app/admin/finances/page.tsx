/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Users } from "lucide-react";
import { DataTable, Column } from "../components/DataTable";
import { Dropdown } from "@/app/components/ui/Dropdown";
import { formatDate } from "@/lib/format-date";
import AddIncomeModal from "../components/AddIncomeModal";
import AddExpenseModal from "../components/AddExpenseModal";
import FinanceChart from "../components/FinanceChart";

export interface FinanceRecord {
  id: string;
  title: string;
  amount: number;
  grossAmount?: number;
  paystackFee?: number;
  category: string;
  type: "income" | "expense";
  narration?: string;
  date: string;
  source?: string;
}

type TimeFilterOption = "all" | "week" | "month" | "year" | "custom";

export default function FinancesAdminPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Modals
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
      const end = customEndDate ? new Date(customEndDate) : new Date(8640000000000000);
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
      case "week": return "This Week (Sun+)";
      case "month": return "This Month";
      case "year": return "This Year";
      case "custom": return "Custom Range";
      default: return "All Time";
    }
  };

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
          <FiCalendar size={12} className="text-neutral-500" /> {formatDate(row.date)}
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
            Automated subscription revenue logging paired with manual expense & income tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              <button onClick={() => setTimeFilter("all")} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-900">All Time</button>
              <button onClick={() => setTimeFilter("week")} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-900">This Week</button>
              <button onClick={() => setTimeFilter("month")} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-900">This Month</button>
              <button onClick={() => setTimeFilter("year")} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-900">This Year</button>
              <button onClick={() => setTimeFilter("custom")} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:bg-neutral-900">Custom Range</button>
            </div>
          </Dropdown>

          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white hover:opacity-75 text-black font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <FiPlus size={16} />
            <span>Add Income</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
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
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Income</span>
          <div className="text-3xl font-black text-white font-mono">₦{totalIncome.toLocaleString()}</div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Expenses</span>
          <div className="text-3xl font-black text-red-400 font-mono">₦{totalExpenses.toLocaleString()}</div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Net Balance</span>
          <div className={`text-3xl font-black font-mono ${netBalance >= 0 ? "text-white" : "text-red-400"}`}>
            ₦{netBalance.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Records</span>
          <div className="text-3xl font-black text-white font-mono">{filteredRecords.length}</div>
        </div>
      </div>

      {/* Reusable Chart Component */}
      <FinanceChart records={filteredRecords} />

      {/* Data Table */}
      <DataTable<FinanceRecord>
        columns={columns.map((col) => ({
          ...col,
          cell: (row: FinanceRecord, idx: number) => (
            <div
              onClick={() => router.push(`/admin/finances/${row.id}`)}
              className="cursor-pointer"
            >
              {col.cell
                ? col.cell(row, idx)
                : col.accessorKey
                ? String(row[col.accessorKey] ?? "")
                : null}
            </div>
          ),
        }))}
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