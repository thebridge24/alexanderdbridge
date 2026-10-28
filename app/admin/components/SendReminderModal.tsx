/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FiMail, FiSend } from "react-icons/fi";
import { PaymentTransactionRecord } from "../payments/page";

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransactionRecord | null;
}

export default function SendReminderModal({
  isOpen,
  onClose,
  transaction,
}: SendReminderModalProps) {
  const [sending, setSending] = useState(false);
  const [customNote, setCustomNote] = useState(
    "Hello! ❤️ Thank you for being part of Bridge Daily. We noticed that your support contribution wasn't completed, so we thought to reach out and remind you. Your support helps us keep this platform running and continue sharing God's Word with more people. If you intended to complete your contribution, you can still do so below. We truly appreciate you being part of this journey, and we pray that God continues to bless you, strengthen you, and provide for all your needs. 🙏❤️",
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/payments/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: transaction.user_email,
          reference: transaction.paystack_reference,
          planType: transaction.plan_type,
          amount: transaction.amount,
          status: transaction.status,
          note: customNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminder");

      setSuccessMsg(
        `Reminder email successfully sent to ${transaction.user_email}!`,
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to send reminder email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 size-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <IoClose className="size-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                <FiMail className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Send Payment Reminder
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  {transaction.user_email}
                </p>
              </div>
            </div>

            {successMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-xs font-bold text-center">
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSendReminder} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">
                      Transaction Status:
                    </span>
                    <span className="font-mono uppercase font-bold text-amber-400">
                      {transaction.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Plan & Amount:</span>
                    <span className="font-mono text-white font-bold">
                      {transaction.plan_type} (₦
                      {(Number(transaction.amount) || 0).toLocaleString()})
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Custom Reminder Message
                  </label>
                  <textarea
                    rows={8}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    className="w-full bg-transparent text-white pb-2 border-b border-white/15 focus:border-primary outline-none transition-colors"
                    required
                  />
                </div>

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
                    disabled={sending}
                    className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FiSend size={14} />
                    <span>{sending ? "Sending..." : "Send Reminder"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
