"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiClock, FiDollarSign, FiRefreshCw, FiUsers, FiXCircle } from "react-icons/fi";

type PaymentStatus = "pending" | "success" | "cancelled" | "failed";

interface Subscription {
  id: string;
  user_email: string | null;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  status: string;
  paystack_reference: string | null;
  updated_at: string;
}

interface Transaction {
  id: string;
  user_email: string | null;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  status: PaymentStatus;
  paystack_reference: string;
  paystack_channel: string | null;
  created_at: string;
}

interface DashboardData {
  subscriptions: Subscription[];
  transactions: Transaction[];
  stats: {
    activeSubscribers: number;
    pendingReviews: number;
    successfulPayments: number;
    cancelledPayments: number;
    failedPayments: number;
    totalRevenue: number;
  };
}

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const statusStyles: Record<PaymentStatus | string, string> = {
  success: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
  active: "bg-emerald-950/70 text-emerald-300 border-emerald-800",
  pending: "bg-amber-950/70 text-amber-300 border-amber-800",
  pending_review: "bg-amber-950/70 text-amber-300 border-amber-800",
  cancelled: "bg-neutral-800 text-neutral-300 border-neutral-700",
  failed: "bg-rose-950/70 text-rose-300 border-rose-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status] || "bg-neutral-900 text-neutral-400 border-neutral-700"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not load subscriptions");
      setData(body);
    } catch (err: any) {
      setError(err?.message || "Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const rows = data?.transactions || [];
    return filter === "all" ? rows : rows.filter((row) => row.status === filter);
  }, [data, filter]);

  const stats = data?.stats;
  const cards = [
    { label: "Active subscribers", value: stats?.activeSubscribers ?? 0, icon: FiUsers, color: "text-blue-400" },
    { label: "Successful payments", value: stats?.successfulPayments ?? 0, icon: FiCheckCircle, color: "text-emerald-400" },
    { label: "Revenue recorded", value: money.format(stats?.totalRevenue ?? 0), icon: FiDollarSign, color: "text-amber-400" },
    { label: "Cancelled attempts", value: stats?.cancelledPayments ?? 0, icon: FiXCircle, color: "text-neutral-300" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-500">Support revenue</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Subscriptions</h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">Monitor active supporters, payment attempts, cancellations, and recorded revenue.</p>
        </div>
        <button onClick={loadData} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-700 px-4 py-2.5 text-xs font-bold text-neutral-200 transition hover:border-red-500 hover:text-white disabled:opacity-50">
          <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl border border-rose-900 bg-rose-950/50 p-4 text-sm text-rose-300">{error}. Apply migration 017 if the transactions table has not been created yet.</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return <div key={card.label} className="rounded-3xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="flex items-center justify-between"><span className="text-xs text-neutral-500">{card.label}</span><Icon className={card.color} /></div>
            <p className="mt-6 text-3xl font-black text-white">{loading ? "—" : card.value}</p>
          </div>;
        })}
      </div>

      <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
        <div className="flex flex-col gap-3 border-b border-neutral-800 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold text-white">Payment activity</h2><p className="mt-1 text-xs text-neutral-500">Every Paystack attempt is kept here, including cancellations.</p></div>
          <div className="flex flex-wrap gap-2">
            {(["all", "success", "pending", "cancelled", "failed"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${filter === item ? "bg-red-600 text-white" : "bg-neutral-900 text-neutral-500 hover:text-white"}`}>{item}</button>)}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-black/30 text-[10px] uppercase tracking-wider text-neutral-500"><tr><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Date</th></tr></thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredTransactions.map((row) => <tr key={row.id} className="hover:bg-white/[0.02]"><td className="px-5 py-4 font-medium text-white">{row.user_email || "Unknown customer"}</td><td className="px-5 py-4 capitalize text-neutral-300">{row.plan_type}<span className="ml-1 text-neutral-600">/ {row.billing_cycle}</span></td><td className="px-5 py-4 text-neutral-200">{money.format(row.amount)}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="max-w-[180px] truncate px-5 py-4 font-mono text-[10px] text-neutral-500" title={row.paystack_reference}>{row.paystack_reference}</td><td className="whitespace-nowrap px-5 py-4 text-neutral-500">{formatDate(row.created_at)}</td></tr>)}
              {!loading && filteredTransactions.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-neutral-500"><FiClock className="mx-auto mb-3 text-xl" />No payment activity for this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
        <div className="border-b border-neutral-800 p-5"><h2 className="font-bold text-white">Current subscribers</h2><p className="mt-1 text-xs text-neutral-500">The latest subscription state for each registered user.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-black/30 text-[10px] uppercase tracking-wider text-neutral-500"><tr><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Updated</th></tr></thead><tbody className="divide-y divide-neutral-900">{(data?.subscriptions || []).map((row) => <tr key={row.id}><td className="px-5 py-4 text-white">{row.user_email || "Unknown customer"}</td><td className="px-5 py-4 capitalize text-neutral-300">{row.plan_type} / {row.billing_cycle}</td><td className="px-5 py-4 text-neutral-200">{money.format(row.amount)}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 text-neutral-500">{formatDate(row.updated_at)}</td></tr>)}{!loading && !(data?.subscriptions || []).length && <tr><td colSpan={5} className="px-5 py-12 text-center text-neutral-500">No subscribers recorded yet.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
