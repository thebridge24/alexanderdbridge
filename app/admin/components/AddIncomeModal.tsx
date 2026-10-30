
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoChevronDown, IoCheckmark } from "react-icons/io5";
import { FiDollarSign } from "react-icons/fi";
import { FormInput, FormTextarea } from "@/app/components/ui/FormInput";
import { Dropdown } from "@/app/components/ui/Dropdown";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddIncomeModal({
  isOpen,
  onClose,
  onSuccess,
}: AddIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Donation");
  const [narration, setNarration] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Category options
  const categories = [
    "Donation",
    "Grant",
    "Bank Transfer",
    "Sponsorship",
    "Other",
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/finances/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount) || 0,
          category,
          narration,
          date,
          type: "income",
        }),
      });

      if (!res.ok) throw new Error("Failed to record income");

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error saving income record.");
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
          className="relative w-full max-w-xl rounded-4xl bg-black border border-neutral-900 p-6 shadow-2xl z-10 text-left space-y-5"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 size-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <IoClose className="size-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-white/10 border border-white/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FiDollarSign className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Record Manual Income
              </h3>
              <p className="text-xs font-mono text-neutral-400">
                Grants, donations, bank transfers
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Income Source / Title"
              placeholder="e.g. Q2 Partnership Grant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Amount (₦)"
                type="number"
                placeholder="50000"
                className="w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Category
                </label>

                <Dropdown
                  align="left"
                  className="w-full"
                  contentClassName=""
                  trigger={
                    <div className="w-full flex items-center justify-between gap-2 bg-neutral-900 border-b border-white/15 text-sm font-semibold text-white py-2 px-2 cursor-pointer hover:bg-neutral-800 transition-colors">
                      <span className="w-full">{category}</span>
                      <IoChevronDown className="size-4 text-neutral-400 shrink-0" />
                    </div>
                  }
                >
                  <div className="p-1">
                    {categories.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setCategory(option)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                          category === option
                            ? "bg-white/10 text-white"
                            : "text-neutral-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{option}</span>
                        {category === option && (
                          <IoCheckmark className="size-4 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </Dropdown>
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
              label="Narration / Description"
              placeholder="Add optional notes or remarks..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-white hover:bg-white/80 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Saving..." : "Save Income"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
