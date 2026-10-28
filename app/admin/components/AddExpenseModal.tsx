/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FiTrendingDown } from "react-icons/fi";
import { FormInput, FormTextarea } from "@/app/components/ui/FormInput";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Operations");
  const [narration, setNarration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/finances/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount) || 0,
          category,
          narration,
          date,
          type: "expense",
        }),
      });

      if (!res.ok) throw new Error("Failed to record expense");

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error saving expense record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-md rounded-4xl bg-neutral-950 border border-neutral-800 p-6 shadow-2xl z-10 text-left space-y-5"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <IoClose className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
              <FiTrendingDown className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Record Expense</h3>
              <p className="text-xs font-mono text-neutral-400">Server hosting, tools, operations</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Expense Title"
              placeholder="e.g. AWS Server Hosting"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Amount (₦)"
                type="number"
                placeholder="15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-900 border-b border-white/15 text-sm font-semibold text-white py-2 outline-none focus:border-primary"
                >
                  <option value="Operations">Operations</option>
                  <option value="Hosting">Hosting & Infrastructure</option>
                  <option value="Marketing">Marketing & Ads</option>
                  <option value="Software">Software & Tools</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <FormInput
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <FormTextarea
              label="Narration / Purpose"
              placeholder="Detailed explanation of the expense..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Saving..." : "Save Expense"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}