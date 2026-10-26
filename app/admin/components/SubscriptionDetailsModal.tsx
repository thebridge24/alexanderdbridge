/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMail, FiTrash2, FiAward, FiCheckCircle, FiAlertCircle, FiEdit2 } from "react-icons/fi";
import { SubscriptionRecord } from "../subscriptions/page";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

interface SubscriptionDetailsModalProps {
  subscription: SubscriptionRecord;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function SubscriptionDetailsModal({
  subscription,
  isOpen,
  onClose,
  onRefresh,
}: SubscriptionDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    userName: subscription.userName,
    email: subscription.email,
    plan: subscription.planName.toLowerCase(),
    billingCycle: subscription.billingCycle as string,
    amount: String(subscription.amount ?? 0),
    status: "active",
    paymentMethod: subscription.paymentMethod as string,
    startDate: subscription.startDate || "",
    expiryDate: subscription.expiryDate || "",
    notes: "",
  });

  const statusToApi = (s: string) =>
    s === "Expired" ? "expired" : s === "Cancelled" ? "canceled" : s === "Pending" ? "pending_review" : "active";

  const startEditing = () => {
    setForm({
      userName: subscription.userName,
      email: subscription.email,
      plan: subscription.planName.toLowerCase(),
      billingCycle: subscription.billingCycle,
      amount: String(subscription.amount ?? 0),
      status: statusToApi(subscription.status),
      paymentMethod: subscription.paymentMethod,
      startDate: subscription.startDate || "",
      expiryDate: subscription.expiryDate || "",
      notes: "",
    });
    setEmailStatus(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setEmailStatus(null);
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: form.userName,
          email: form.email,
          plan: form.plan,
          billingCycle: form.billingCycle,
          amount: Number(form.amount),
          status: form.status,
          paymentMethod: form.paymentMethod,
          isComplimentary: form.paymentMethod === "Complimentary",
          startDate: form.startDate,
          expiryDate: form.expiryDate,
          ...(form.notes ? { notes: form.notes } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");
      onRefresh();
      onClose();
    } catch (err: any) {
      setEmailStatus({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const fieldClass =
    "w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-primary font-mono";
  const labelClass = "text-neutral-500 text-[10px] font-mono block mb-1";

  if (!isOpen) return null;

  const expectedDeletePhrase = `delete ${subscription.userName}`;

  // Handle Send Reminder Email
  const handleSendReminder = async () => {
    try {
      setSendingEmail(true);
      setEmailStatus(null);
      const res = await fetch(`/api/admin/subscriptions/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.id, email: subscription.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reminder email");
      setEmailStatus({ type: "success", text: "Reminder email successfully sent!" });
    } catch (err: any) {
      setEmailStatus({ type: "error", text: err.message || "Failed to send email." });
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle Delete Subscription
  const handleDelete = async () => {
    if (deleteConfirmText !== expectedDeletePhrase) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete subscription");
      onRefresh();
      onClose();
    } catch (err: any) {
      alert(err.message || "Deletion failed.");
    } finally {
      setIsDeleting(false);
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
            <div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Subscription Details</span>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FiAward className="text-primary" /> {subscription.planName} Plan
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {emailStatus && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${emailStatus.type === "success" ? "bg-emerald-950/30 text-emerald-400 border border-emerald-800/40" : "bg-red-950/30 text-red-400 border border-red-800/40"}`}>
              {emailStatus.type === "success" ? <FiCheckCircle size={14} /> : <FiAlertCircle size={14} />}
              <span>{emailStatus.text}</span>
            </div>
          )}

          {isEditing && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Edit Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name</label>
                  <input className={fieldClass} value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Plan</label>
                  <select className={fieldClass} value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                    <option value="reader">Reader</option>
                    <option value="supporter">Supporter</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="partner">Partner</option>
                    <option value="patron">Patron</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Billing Cycle</label>
                  <select className={fieldClass} value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount (₦)</label>
                  <input type="number" min={0} className={fieldClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select className={fieldClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="canceled">Cancelled</option>
                    <option value="paused">Paused</option>
                    <option value="pending_review">Pending</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Payment Method</label>
                  <select className={fieldClass} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="Paystack">Paystack</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Complimentary">Complimentary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Start Date</label>
                  <input type="date" className={fieldClass} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Expiry Date (reminders and the 3-day grace period count from this date)</label>
                  <input type="date" className={fieldClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Note (optional)</label>
                  <input className={fieldClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal note" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {!isEditing && (<>
          {/* User Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">User Information</h4>
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex items-center gap-4">
              <div className="size-12 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-neutral-700">
                {subscription.avatarUrl ? (
                  <img src={subscription.avatarUrl} alt={subscription.userName} className="size-full object-cover" />
                ) : (
                  <span>{subscription.userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                  <span>{subscription.userName}</span>
                  <VerifiedBadge tier={subscription.tier} name={subscription.userName} email={subscription.email} size="sm" />
                </div>
                <div className="text-xs text-neutral-400 font-mono">{subscription.email}</div>
                <div className="text-[10px] text-neutral-500 font-mono">User ID: {subscription.userId}</div>
              </div>
            </div>
          </div>

          {/* Subscription Metadata */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono">Membership Details</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Subscription ID</span>
                <span className="text-white font-mono font-bold truncate block mt-0.5">{subscription.id}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Status</span>
                <span className="text-emerald-400 font-bold font-mono block mt-0.5">{subscription.status}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Billing Cycle & Amount</span>
                <span className="text-white font-mono font-bold block mt-0.5">
                  {subscription.isComplimentary ? "Complimentary" : `₦${subscription.amount.toLocaleString()} (${subscription.billingCycle})`}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Payment Method</span>
                <span className="text-white font-mono font-bold block mt-0.5">{subscription.paymentMethod}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Start Date</span>
                <span className="text-white font-mono block mt-0.5">{subscription.startDate}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="text-neutral-500 text-[10px] font-mono block">Expiry / Next Payment</span>
                <span className="text-white font-mono block mt-0.5">{subscription.expiryDate || subscription.nextPaymentDate || "N/A"}</span>
              </div>
            </div>
            {subscription.paystackRef && (
              <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                <span className="text-neutral-500 text-[10px] font-mono block">Paystack Transaction Reference</span>
                <span className="text-white font-mono font-semibold block mt-0.5">{subscription.paystackRef}</span>
              </div>
            )}
          </div>

          </>)}

          {/* Delete confirmation section */}
          {showDeletePrompt && (
            <div className="p-4 rounded-2xl bg-red-950/20 border border-red-800/50 space-y-3">
              <span className="text-xs text-red-400 block font-medium">
                To confirm deletion, please type <strong className="text-white font-mono">{expectedDeletePhrase}</strong> below:
              </span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={expectedDeletePhrase}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none focus:border-primary font-mono"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeletePrompt(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== expectedDeletePhrase || isDeleting}
                  className={`px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white ${deleteConfirmText !== expectedDeletePhrase ? "opacity-50 cursor-not-allowed" : "hover:bg-primary"}`}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-900">
            <button
              onClick={handleSendReminder}
              disabled={sendingEmail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs transition-colors border border-neutral-800"
            >
              <FiMail size={14} />
              <span>{sendingEmail ? "Sending..." : "Send Reminder Email"}</span>
            </button>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold text-xs transition-colors border border-neutral-800"
                >
                  <FiEdit2 size={14} />
                  <span>Edit Details</span>
                </button>
              )}
              {!showDeletePrompt && (
                <button
                  onClick={() => setShowDeletePrompt(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950 text-red-400 font-bold text-xs transition-colors border border-red-800/40"
                >
                  <FiTrash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}