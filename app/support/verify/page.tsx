/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
} from "@/app/components/support/SupportPlanCard";
import { VERIFICATION_TIERS } from "@/lib/utils/verification";
import {
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Mail,
  User,
  CreditCard,
  FileText,
} from "lucide-react";
import Link from "next/link";

function VerifyForm() {
  const searchParams = useSearchParams();

  const initialRef =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const initialPlan = (searchParams.get("plan") as PlanType) || "supporter";
  const initialCycle = (searchParams.get("cycle") as BillingCycle) || "monthly";
  const paymentWasVerified = searchParams.get("verified") === "true";
  const paymentError = searchParams.get("payment") === "failed";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<PlanType>(
    initialPlan in PLAN_CONFIGS ? initialPlan : "supporter",
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    initialCycle === "yearly" ? "yearly" : "monthly",
  );
  const [reference, setReference] = useState(initialRef);
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(paymentWasVerified);
  const [serverMessage, setServerMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (paymentError) {
      setErrorMessage(
        "This payment was not completed. No active subscription was created. You can try again from the support plans.",
      );
    }
  }, [paymentError]);

  // Retrieve user session if logged in
  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setEmail(data.user.email || "");
            setFullName(
              data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                "",
            );
          }
        });
      }
    } catch (err) {
      console.warn("Could not retrieve user session:", err);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      let accessToken: string | null = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        accessToken = data?.session?.access_token || null;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/support/verify-request", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          plan,
          billingCycle,
          reference: reference.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit verification details");
      }

      setIsSuccess(true);
      setServerMessage(
        data?.message ||
          "Your verified badge is on the way! Our review team is on it.",
      );

      if (supabase && accessToken) {
        supabase.auth.refreshSession().catch(() => {});
      }
    } catch (err: any) {
      console.error("Verification submit error:", err);
      setErrorMessage(
        err?.message ||
          "Something went wrong. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const planConfig = PLAN_CONFIGS[plan];
  const tier = planConfig?.showVerifiedIcon && plan !== "reader" ? plan : null;

  if (isSuccess) {
    return (
      <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="size-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl shadow-emerald-900/40">
          <CheckCircle2 className="size-10" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Your Verified Badge is on the Way! 🎉
          </h2>
          <p className="text-neutral-300 text-sm leading-relaxed max-w-md mx-auto">
            Our review team is currently reviewing your payment details. Once
            confirmed, your verified badge will be activated across your
            profile, daily devotional comments, and community interactions.
          </p>
        </div>

        {/* Badge Preview Card */}
        {tier && (
          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-2 max-w-xs mx-auto shadow-inner">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
              Assigned Tier
            </span>
            <div className="flex items-center justify-center gap-1.5 py-1">
              <span className="text-sm font-bold text-white">
                {fullName || "Believer"}
              </span>
              <VerifiedBadge tier={tier} size="md" />
            </div>
            <p className="text-[11px] text-neutral-400">
              {
                VERIFICATION_TIERS[tier as "supporter" | "sponsor" | "patron"]
                  .description
              }
            </p>
          </div>
        )}

        <div className="pt-2">
          <Link
            href="/devotional"
            className="inline-block w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-primary text-white font-bold text-xs rounded-full shadow-lg shadow-red-950/50 transition-all uppercase tracking-wider"
          >
            Return to Daily Devotional
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
        <Link
          href="/devotional"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-red-950/40 border border-red-900/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <ShieldCheck className="size-3" /> Payment Verification
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Verify Your Payment Details
        </h1>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Fill in the details you used when making payment. Once submitted, our
          review team will confirm your support and activate your badge.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 size-4 text-neutral-500" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Email Used for Payment
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 size-4 text-neutral-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
        </div>

        {/* Plan & Cycle Selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Support Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanType)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-red-600 transition-colors capitalize cursor-pointer"
            >
              <option value="reader">Reader (₦500/mo)</option>
              <option value="supporter">Supporter (₦1,000/mo)</option>
              <option value="sponsor">Sponsor (₦1,500/mo)</option>
              <option value="partner">Partner (₦2,500/mo)</option>
              <option value="patron">Patron (₦5000/mo)</option>
              <option value="visionary">Visionary (₦10,000/mo)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Billing Cycle
            </label>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-red-600 transition-colors capitalize cursor-pointer"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Transaction Reference */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Payment / Transfer Reference
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-3.5 size-4 text-neutral-500" />
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Paystack Ref, Session ID, or Transfer Narration"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <span className="text-[10px] text-neutral-500 mt-1 block">
            * Auto-filled if you completed checkout via Paystack.
          </span>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
            Additional Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-3.5 size-4 text-neutral-500" />
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via GTBank transfer, account name John Doe"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-full bg-red-600 hover:bg-primary active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-red-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Submitting for
              Review...
            </>
          ) : (
            "Submit for Verification"
          )}
        </button>
      </form>
    </div>
  );
}

export default function VerifyPaymentPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-xs text-neutral-400">
              Loading verification details...
            </span>
          </div>
        }
      >
        <VerifyForm />
      </Suspense>
    </div>
  );
}
