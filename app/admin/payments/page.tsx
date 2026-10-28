/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiChevronDown,
  FiFilter,
  FiCreditCard,
  FiRefreshCw,
} from "react-icons/fi";
import { DataTable, Column } from "../components/DataTable";
import { formatDate } from "@/lib/format-date";
import { Dropdown } from "@/app/components/ui/Dropdown";
import SendReminderModal from "../components/SendReminderModal"; // <--- Imported reminder modal
import { Send } from "lucide-react";

export interface PaymentTransactionRecord {
  id: string;
  user_id?: string;
  user_email: string;
  plan_type: string;
  billing_cycle: "monthly" | "yearly";
  amount: number;
  paystack_reference: string;
  paystack_channel?: string;
  status: "success" | "pending" | "cancelled" | "failed";
  paid_at?: string;
  created_at: string;
  updated_at?: string;
  userName?: string;
  avatarUrl?: string;
  tier?: string;
}

type TimeFilterOption = "all" | "week" | "month" | "year" | "custom";
type StatusFilterOption = "all" | "success" | "pending" | "failed" | "cancelled";

export default function PaymentsAdminPage() {
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>([]);
  const [stats, setStats] = useState({
    activeSubscribers: 0,
    pendingReviews: 0,
    successfulPayments: 0,
    cancelledPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [timeFilter, setTimeFilter] = useState<TimeFilterOption>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Reminder Modal State
  const [selectedTxForReminder, setSelectedTxForReminder] = useState<PaymentTransactionRecord | null>(null);

  const fetchTransactionsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payments");
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;

      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load payment transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, []);

  const filterByDate = (dateStr: string) => {
    if (timeFilter === "all") return true;
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (timeFilter === "month") {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
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

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.paystack_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.plan_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.paystack_channel?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = filterByDate(tx.paid_at || tx.created_at);
    const matchesStatus = statusFilter === "all" || tx.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const filteredSuccessful = filteredTransactions.filter((tx) => tx.status === "success");
  const filteredRevenue = filteredSuccessful.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
  const filteredFailed = filteredTransactions.filter((tx) => tx.status === "failed").length;
  const filteredPending = filteredTransactions.filter((tx) => tx.status === "pending").length;

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case "week": return "This Week (Sun+)";
      case "month": return "This Month";
      case "year": return "This Year";
      case "custom": return "Custom Range";
      default: return "All Time";
    }
  };

  const getStatusFilterLabel = () => {
    switch (statusFilter) {
      case "success": return "Successful";
      case "pending": return "Pending";
      case "failed": return "Failed";
      case "cancelled": return "Cancelled";
      default: return "All Statuses";
    }
  };

  const columns: Column<PaymentTransactionRecord>[] = [
    {
      header: "Reference & Channel",
      className: "min-w-[200px] whitespace-nowrap",
      cell: (row) => (
        <div>
          <span className="font-bold font-mono text-white block">
            {row.paystack_reference || "N/A"}
          </span>
          <span className="text-[10px] font-mono text-neutral-400 uppercase">
            Channel: {row.paystack_channel || "Paystack"}
          </span>
        </div>
      ),
    },
    {
      header: "Payer Email",
      accessorKey: "user_email",
      className: "text-neutral-300 font-mono text-xs",
    },
    {
      header: "Plan & Cycle",
      cell: (row) => (
        <div>
          <span className="font-bold text-white capitalize block">{row.plan_type}</span>
          <span className="text-[10px] font-mono text-neutral-400 capitalize">
            {row.billing_cycle}
          </span>
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-mono font-bold text-white">
          ₦{(Number(row.amount) || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Transaction Date",
      cell: (row) => (
        <span className="font-mono text-neutral-300 flex items-center gap-1">
          <FiCalendar size={12} className="text-neutral-500" />{" "}
          {formatDate(row.paid_at || row.created_at)}
        </span>
      ),
    },
    {
      header: "Status & Action",
      cell: (row) => {
        const statusStyles: Record<string, string> = {
          success: "bg-emerald-950/80 text-emerald-400 border-emerald-800/50",
          pending: "bg-amber-950/80 text-amber-400 border-amber-800/50",
          failed: "bg-red-950/80 text-red-400 border-red-800/50",
          cancelled: "bg-neutral-900 text-neutral-400 border-neutral-800",
        };
        return (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border capitalize ${
                statusStyles[row.status] || "bg-neutral-900 text-neutral-400"
              }`}
            >
              {row.status}
            </span>
            {row.status !== "success" && (
              <span className="text-[10px] font-mono text-white/70 underline hover:text-white">
                <Send className="size-4" />
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <FiCreditCard className="text-primary size-6" /> Payment Transactions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Monitor incoming Paystack payments, verify audit logs, and send reminders for pending/failed contributions.
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
                  timeFilter === "all" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setTimeFilter("week")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "week" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Week (Sun - Sat)
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "month" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter("year")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "year" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                This Year
              </button>
              <button
                onClick={() => setTimeFilter("custom")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  timeFilter === "custom" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Custom Range
              </button>
            </div>
          </Dropdown>

          {/* Status Filter Dropdown */}
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <span>Status: {getStatusFilterLabel()}</span>
                <FiChevronDown className="size-3.5 text-neutral-400 ml-1" />
              </button>
            }
          >
            <div className="p-2 space-y-1 w-44">
              <button
                onClick={() => setStatusFilter("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === "all" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                All Statuses
              </button>
              <button
                onClick={() => setStatusFilter("success")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === "success" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Successful
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === "pending" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("failed")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === "failed" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setStatusFilter("cancelled")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  statusFilter === "cancelled" ? "bg-red-600 text-white" : "text-neutral-300 hover:bg-neutral-900"
                }`}
              >
                Cancelled
              </button>
            </div>
          </Dropdown>

          <button
            onClick={fetchTransactionsData}
            title="Refresh Transactions"
            className="p-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <FiRefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Custom Date Inputs Drawer */}
      {timeFilter === "custom" && (
        <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold uppercase text-neutral-400 font-mono">Custom Range:</span>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-neutral-500 font-mono">From:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-neutral-500 font-mono">To:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-primary font-mono"
            />
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/40"><FiDollarSign size={18} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">₦{filteredRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-neutral-500 mt-1">From {filteredSuccessful.length} successful payments</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Successful</span>
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/40"><FiCheckCircle size={18} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{filteredSuccessful.length}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Verified paid transactions</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pending</span>
            <div className="p-2.5 rounded-2xl bg-amber-950/30 text-amber-400 border border-amber-800/40"><FiClock size={18} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{filteredPending}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Click any row to send reminder</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Failed / Cancelled</span>
            <div className="p-2.5 rounded-2xl bg-red-950/30 text-red-400 border border-red-800/40"><FiXCircle size={18} /></div>
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{filteredFailed}</div>
            <p className="text-[11px] text-neutral-500 mt-1">Click row to follow up</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-4" />
          <input
            type="text"
            placeholder="Search by email, reference, plan, or channel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400">
          <span className="text-white font-bold">{filteredTransactions.length}</span> transactions shown
        </div>
      </div>

      {/* Transactions Data Table with click to open reminder */}
      <div
        onClick={(e) => {
          const target = (e.target as HTMLElement).closest("tr");
          if (target && (target as HTMLElement).dataset.txId) {
            const tx = transactions.find((t) => t.id === (target as HTMLElement).dataset.txId);
            if (tx) setSelectedTxForReminder(tx);
          }
        }}
      >
        <DataTable<PaymentTransactionRecord>
          columns={columns.map((col) => ({
            ...col,
            cell: (row: PaymentTransactionRecord, idx: number) => (
              <div 
                onClick={() => setSelectedTxForReminder(row)}
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
          data={filteredTransactions}
          isLoading={loading}
          emptyMessage="No payment transactions found."
        />
      </div>

      {/* Send Reminder Modal Component */}
      <SendReminderModal
        isOpen={Boolean(selectedTxForReminder)}
        onClose={() => setSelectedTxForReminder(null)}
        transaction={selectedTxForReminder}
      />
    </div>
  );
}