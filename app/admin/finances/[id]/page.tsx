"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiCalendar, FiTag, FiFileText } from "react-icons/fi";
import { formatDate } from "@/lib/format-date";
import { FinanceRecord } from "../page";

export default function FinanceRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<FinanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/finances");
        if (res.ok) {
          const data = await res.json();
          const found = (data.records || []).find((r: FinanceRecord) => r.id === params.id);
          setRecord(found || null);
        }
      } catch (err) {
        console.error("Failed to load record:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchRecord();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs font-mono text-neutral-500">
        Loading transaction details...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4 max-w-xl mx-auto text-center pt-12">
        <p className="text-sm font-mono text-neutral-400">Transaction record not found.</p>
        <button
          onClick={() => router.push("/admin/finances")}
          className="px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-white font-bold text-xs"
        >
          Back to Finances
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Back Button Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/finances")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
        >
          <FiArrowLeft size={16} className="text-primary" />
          <span>Back to Finances</span>
        </button>
        <span
          className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase ${
            record.type === "income"
              ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/50"
              : "bg-red-950/80 text-red-400 border-red-800/50"
          }`}
        >
          {record.type} record
        </span>
      </div>

      {/* Record Details Card */}
      <div className="p-8 rounded-[32px] bg-neutral-950 border border-neutral-800 space-y-6 shadow-2xl">
        <div className="border-b border-neutral-800 pb-5">
          <h2 className="text-xl font-black text-white">{record.title}</h2>
          <p className="text-xs font-mono text-neutral-400 mt-1 flex items-center gap-1.5">
            <FiCalendar size={13} className="text-primary" /> Recorded on {formatDate(record.date)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Net Amount</span>
            <div className={`text-2xl font-black font-mono ${record.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
              {record.type === "income" ? "+" : "-"}₦{(Number(record.amount) || 0).toLocaleString()}
            </div>
          </div>

          {record.grossAmount !== undefined && (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Gross Amount</span>
              <div className="text-2xl font-black font-mono text-white">
                ₦{(Number(record.grossAmount) || 0).toLocaleString()}
              </div>
            </div>
          )}

          {record.paystackFee !== undefined && record.paystackFee > 0 && (
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
              <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Paystack Processing Fee</span>
              <div className="text-2xl font-black font-mono text-amber-400">
                -₦{(Number(record.paystackFee) || 0).toLocaleString()}
              </div>
            </div>
          )}

          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">Category</span>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <FiTag className="text-primary size-4" /> {record.category}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
            <FiFileText size={13} /> Narration / Remarks
          </span>
          <p className="text-xs font-mono text-neutral-200 leading-relaxed bg-black/40 p-4 rounded-xl border border-neutral-800">
            {record.narration || "No narration or additional description provided for this record."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900/30 border border-neutral-900 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>Transaction ID: {record.id}</span>
          <span>Type: {record.type.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}