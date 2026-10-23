/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSearch, FiAward, FiChevronDown, FiCheck } from "react-icons/fi";

interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Base monthly prices mapping
const PLAN_MONTHLY_PRICES: Record<string, number> = {
  Reader: 500,
  Supporter: 1000,
  Sponsor: 1500,
  Partner: 2500,
  Patron: 5000,
};

const PLANS = [
  { name: "Reader", description: "Standard reader access" },
  {
    name: "Supporter",
    description: "Helps us improve and reach more believers",
  },
  {
    name: "Sponsor",
    description: "Keeps Bridge Daily accessible to the world",
  },
  {
    name: "Partner",
    description: "Help us reach more lives through God's Word",
  },
  { name: "Patron", description: "Builds the future of Bridge Daily" },
];

export default function AddSubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSubscriptionModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Custom Plan Dropdown State
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const planDropdownRef = useRef<HTMLDivElement>(null);

  // Form State
  const [planName, setPlanName] = useState("Supporter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [amount, setAmount] = useState<number>(1000);
  const [paymentType, setPaymentType] = useState<"paid" | "complimentary">(
    "paid",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "Paystack" | "Cash" | "Bank Transfer" | "Other"
  >("Paystack");
  const [paystackRef, setPaystackRef] = useState("");
  const [durationMonths, setDurationMonths] = useState<number>(12); // For complimentary
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch users for selector
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to load users for selector:", err);
      }
    }
    if (isOpen) fetchUsers();
  }, [isOpen]);

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        planDropdownRef.current &&
        !planDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPlanDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Recalculate amount whenever plan or billing cycle changes
  useEffect(() => {
    const monthlyPrice = PLAN_MONTHLY_PRICES[planName] || 1000;
    if (billingCycle === "yearly") {
      // monthly * 12 - 10%
      const calculatedYearly = Math.round(monthlyPrice * 11);
      setAmount(calculatedYearly);
    } else {
      setAmount(monthlyPrice);
    }
  }, [planName, billingCycle]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setErrorMsg("Please select a user.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const payload = {
        userId: selectedUser.id || selectedUser._id,
        planName,
        billingCycle,
        amount: paymentType === "complimentary" ? 0 : amount,
        paymentMethod:
          paymentType === "complimentary" ? "Complimentary" : paymentMethod,
        paystackRef: paymentMethod === "Paystack" ? paystackRef : undefined,
        isComplimentary: paymentType === "complimentary",
        durationMonths:
          paymentType === "complimentary" ? durationMonths : undefined,
      };

      const res = await fetch("/api/support/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create subscription");

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-neutral-950 border border-white/15 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                Membership Admin
              </span>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FiAward className="text-red-500" /> Add Subscription Record
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-400">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Step A: Select User */}
            <div className="space-y-1.5 relative">
              <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                Select User
              </label>
              {selectedUser ? (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold">
                      {(selectedUser.name || "U").charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {selectedUser.name}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {selectedUser.email}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-xs text-red-400 hover:underline font-semibold"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="mt-2"
                  >
                    <input
                      type="text"
                      placeholder="Type name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-3 py-2 rounded-full bg-neutral-850 border border-neutral-800 text-white outline-none text-xs"
                    />
                  </div>
                  {/* <div className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer flex items-center justify-between">
                    <span className="text-neutral-400">
                      Search & select user...
                    </span>
                    <FiSearch size={14} className="text-neutral-500" />
                  </div> */}

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl z-30 overflow-hidden max-h-60 overflow-y-auto">
                      <div className="divide-y divide-neutral-800">
                        {filteredUsers.map((u) => (
                          <div
                            key={u.id || u._id}
                            onClick={() => {
                              setSelectedUser(u);
                              setIsDropdownOpen(false);
                            }}
                            className="p-3 hover:bg-neutral-800/60 cursor-pointer flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-white">
                                {u.name}
                              </div>
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step B: Custom Subscription Plan Dropdown */}
            <div className="space-y-1.5 relative" ref={planDropdownRef}>
              <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                Subscription Plan
              </label>

              <div
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white cursor-pointer flex items-center justify-between hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{planName} Plan</span>
                  <span className="text-[10px] font-mono text-red-400">
                    (₦{PLAN_MONTHLY_PRICES[planName]?.toLocaleString()}/mo)
                  </span>
                </div>
                <FiChevronDown
                  size={14}
                  className={`text-neutral-400 transition-transform ${isPlanDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>

              {isPlanDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl z-30 overflow-hidden divide-y divide-neutral-800">
                  {PLANS.map((p) => {
                    const isSelected = planName === p.name;
                    const monthlyVal = PLAN_MONTHLY_PRICES[p.name];
                    return (
                      <div
                        key={p.name}
                        onClick={() => {
                          setPlanName(p.name);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`p-3.5 cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-red-950/30 text-white"
                            : "hover:bg-neutral-800/60 text-neutral-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            {p.name} Plan
                            {isSelected && (
                              <FiCheck size={12} className="text-red-500" />
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {p.description}
                          </div>
                        </div>
                        <div className="font-mono text-xs font-bold text-red-400">
                          ₦{monthlyVal.toLocaleString()}/mo
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step C: Billing Cycle & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => {
                    const cycle = e.target.value as "monthly" | "yearly";
                    setBillingCycle(cycle);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-red-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (10% Off)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  Amount (₦){" "}
                  {billingCycle === "yearly" && (
                    <span className="text-red-400 font-normal lowercase">
                      (Get 1 month free)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  disabled={paymentType === "complimentary"}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            {/* Step D: Access Type */}
            <div className="space-y-2">
              <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                Subscription Access Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType("paid")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${paymentType === "paid" ? "bg-red-950/40 border-red-600 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}
                >
                  Paid Subscription
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("complimentary")}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${paymentType === "complimentary" ? "bg-purple-950/40 border-purple-600 text-white" : "bg-neutral-900 border-neutral-800 text-neutral-400"}`}
                >
                  Complimentary Access
                </button>
              </div>
            </div>

            {paymentType === "paid" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none"
                  >
                    <option value="Paystack">Paystack</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {paymentMethod === "Paystack" && (
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      Paystack Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. T123456789"
                      value={paystackRef}
                      onChange={(e) => setPaystackRef(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none font-mono"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  Access Duration
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white outline-none"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                  <option value={24}>2 Years (Permanent Mentor)</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-lg shadow-red-950/50"
              >
                {submitting ? "Saving..." : "Save Subscription"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
