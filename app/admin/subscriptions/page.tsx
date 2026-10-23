/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiDollarSign, FiUsers, FiAward, FiCalendar } from "react-icons/fi";
import { DataTable, Column } from "../components/DataTable"; // Reusing your shared DataTable component
import SubscriptionDetailsModal from "../components/SubscriptionDetailsModal";
import AddSubscriptionModal from "../components/AddSubscriptionModal";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userName: string;
  email: string;
  avatarUrl?: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  currency: string;
  startDate: string;
  nextPaymentDate?: string;
  expiryDate?: string;
  paymentMethod: "Paystack" | "Cash" | "Bank Transfer" | "Complimentary" | "Other";
  status: "Active" | "Expired" | "Pending" | "Cancelled" | "Complimentary";
  paystackRef?: string;
  isComplimentary: boolean;
  tier?: string;
  createdAt: string;
}

export default function SubscriptionsAdminPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch subscriptions from backend API
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support/subscribe");
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error("Failed to load subscriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Compute Overview Stats
  const activePaidSubs = subscriptions.filter((s) => s.status === "Active" && !s.isComplimentary);
  const totalRevenue = activePaidSubs.reduce((acc, s) => acc + (s.amount || 0), 0);
  const activeCount = subscriptions.filter((s) => s.status === "Active" || s.status === "Complimentary").length;
  
  // Unique subscribed users vs total registered users percentage estimate
  const uniqueSubscribedUsers = new Set(subscriptions.filter(s => s.status === "Active" || s.status === "Complimentary").map(s => s.userId)).size;
  const subscriptionPercentage = uniqueSubscribedUsers > 0 ? ((uniqueSubscribedUsers / 100) * 100).toFixed(1) : "0.0"; // Adjust denominator if total user count is fetched

  // Filtered Subscriptions
  const filteredSubscriptions = subscriptions.filter(
    (s) =>
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Define Columns for the shared DataTable component
  const columns: Column<SubscriptionRecord>[] = [
    {
      header: "User",
      className: "min-w-[200px]",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold overflow-hidden shrink-0 border border-neutral-700">
            {row.avatarUrl ? (
              <img src={row.avatarUrl} alt={row.userName} className="size-full object-cover" />
            ) : (
              <span>{row.userName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{row.userName}</span>
              <VerifiedBadge tier={row.tier} name={row.userName} email={row.email} size="xs" />
            </div>
            <span className="text-[10px] font-mono text-neutral-500">ID: {row.userId.slice(0, 8)}...</span>
          </div>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      className: "text-neutral-400 font-mono text-xs",
    },
    {
      header: "Subscription Plan",
      cell: (row) => (
        <div>
          <span className="font-bold text-white block">{row.planName}</span>
          <span className="text-[10px] font-mono text-neutral-400 capitalize">{row.billingCycle}</span>
        </div>
      ),
    },
    {
      header: "Subscription Price",
      cell: (row) => (
        <div>
          {row.isComplimentary ? (
            <span className="px-2.5 py-1 rounded-full bg-purple-950/80 text-purple-400 border border-purple-800/50 text-[10px] font-mono font-bold">
              Complimentary
            </span>
          ) : (
            <span className="font-mono font-bold text-white">
              ₦{row.amount.toLocaleString()} <span className="text-[10px] text-neutral-400 font-normal">/ {row.billingCycle === "yearly" ? "yr" : "mo"}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Subscription Date",
      cell: (row) => (
        <span className="font-mono text-neutral-300 flex items-center gap-1">
          <FiCalendar size={12} className="text-neutral-500" /> {row.startDate}
        </span>
      ),
    },
    {
      header: "Payment Method",
      cell: (row) => (
        <span className="text-xs font-mono text-neutral-300 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => {
        const statusColors: Record<string, string> = {
          Active: "bg-emerald-950/80 text-emerald-400 border-emerald-800/50",
          Complimentary: "bg-purple-950/80 text-purple-400 border-purple-800/50",
          Expired: "bg-neutral-900 text-neutral-400 border-neutral-800",
          Pending: "bg-amber-950/80 text-amber-400 border-amber-800/50",
          Cancelled: "bg-red-950/80 text-red-400 border-red-800/50",
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${statusColors[row.status] || "bg-neutral-900 text-neutral-400"}`}>
            {row.status}
          </span>
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
            <FiAward className="text-red-500 size-6" /> Subscriptions
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage supporters, track subscription revenue, and keep every membership up to date.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all cursor-pointer w-fit"
        >
          <FiPlus size={16} />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Subscription Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card A: Total Revenue */}
        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 text-emerald-400 border border-emerald-800/40">
              <FiDollarSign size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-[11px] text-neutral-500 mt-1">From recorded successful subscription payments</p>
          </div>
        </div>

        {/* Card B: Total Subscriptions */}
        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Subscriptions</span>
            <div className="p-2.5 rounded-2xl bg-red-950/30 text-red-500 border border-red-800/40">
              <FiAward size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono">{activeCount}</div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {activePaidSubs.length} paying · {activeCount - activePaidSubs.length} complimentary
            </p>
          </div>
        </div>

        {/* Card C: Users Subscribed Percentage */}
        <div className="p-6 rounded-3xl bg-neutral-950 border border-white/15 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Subscribed Ratio</span>
            <div className="p-2.5 rounded-2xl bg-blue-950/30 text-blue-400 border border-blue-800/40">
              <FiUsers size={18} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white font-mono">{subscriptionPercentage}%</div>
            <p className="text-[11px] text-neutral-500 mt-1">Active subscribers / registered users</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 size-4" />
          <input
            type="text"
            placeholder="Search by name, email, plan, or payment method..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-red-500 transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-neutral-400">
          Showing <span className="text-white font-bold">{filteredSubscriptions.length}</span> records
        </div>
      </div>

     {/* Subscriptions Table (Reusing shared DataTable component) */}
      <div onClick={(e) => {
        const target = (e.target as HTMLElement).closest("tr");
        if (target && (target as HTMLElement).dataset.subId) {
          const sub = subscriptions.find(s => s.id === (target as HTMLElement).dataset.subId);
          if (sub) setSelectedSub(sub);
        }
      }}>
        <DataTable<SubscriptionRecord>
          columns={columns.map(col => ({
            ...col,
            cell: (row: SubscriptionRecord, idx: number) => (
              <div onClick={() => setSelectedSub(row)}>
                {col.cell 
                  ? col.cell(row, idx) 
                  : col.accessorKey 
                  ? String(row[col.accessorKey] ?? "") 
                  : null}
              </div>
            )
          }))}
          data={filteredSubscriptions}
          isLoading={loading}
          emptyMessage="No subscription records found."
        />
      </div>

      {/* Subscription Details Modal */}
      {selectedSub && (
        <SubscriptionDetailsModal
          subscription={selectedSub}
          isOpen={Boolean(selectedSub)}
          onClose={() => setSelectedSub(null)}
          onRefresh={fetchSubscriptions}
        />
      )}

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <AddSubscriptionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchSubscriptions}
        />
      )}
    </div>
  );
}