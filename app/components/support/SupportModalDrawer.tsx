"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SupportIntroScreen } from "./SupportIntroScreen";
import { SupportPlanCard, PlanType, BillingCycle, PLAN_CONFIGS } from "./SupportPlanCard";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { CheckCircle2, Loader2, AlertCircle, Mail, CreditCard } from "lucide-react";

interface SupportModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onSelectPlan?: (plan: PlanType, billingCycle?: BillingCycle) => void;
}

export const SupportModalDrawer: React.FC<SupportModalDrawerProps> = ({
  isOpen,
  onClose,
  userName = "Alexander",
  onSelectPlan,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [subscribedPlan, setSubscribedPlan] = useState<PlanType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Email collection state for unauthenticated users
  const [showEmailPrompt, setShowEmailPrompt] = useState<boolean>(false);
  const [manualEmail, setManualEmail] = useState<string>("");
  const [pendingSelection, setPendingSelection] = useState<{
    plan: PlanType;
    billingCycle: BillingCycle;
  } | null>(null);

  // Retrieve logged-in Supabase user if available
  useEffect(() => {
    if (!isOpen) return;

    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            setCurrentUser(data.user);
          }
        });
      }
    } catch (err) {
      console.warn("Could not retrieve user session in SupportModalDrawer:", err);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (currentStep === 0) setCurrentStep(1);
  };

  const effectiveUserName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    userName;

  /**
   * Internal Self-Contained Paystack Subscription API Handler
   * Anywhere this drawer is called, choosing a plan initializes Paystack payment.
   */
  const handlePlanChoice = async (
    plan: PlanType,
    billingCycle: BillingCycle = "monthly",
    overrideEmail?: string,
  ) => {
    const userEmail =
      overrideEmail || currentUser?.email || manualEmail.trim();

    // If user is not logged in and hasn't given an email, prompt for email first
    if (!userEmail || !userEmail.includes("@")) {
      setPendingSelection({ plan, billingCycle });
      setShowEmailPrompt(true);
      return;
    }

    setIsSubscribing(true);
    setErrorMessage(null);
    setShowEmailPrompt(false);

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

      // 1. Initialize Paystack Transaction
      const paystackRes = await fetch("/api/support/paystack/initialize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan,
          billingCycle,
          email: userEmail,
          name: effectiveUserName,
        }),
      });

      const paystackData = await paystackRes.json().catch(() => null);

      // If Paystack successfully provided a checkout authorization URL, redirect to Paystack
      if (paystackRes.ok && paystackData?.authorizationUrl) {
        window.location.href = paystackData.authorizationUrl;
        return;
      }

      // If PAYSTACK_SECRET_KEY is not configured yet on the server, fall back to direct subscription
      if (paystackData?.isPaystackConfigured === false) {
        const directRes = await fetch("/api/support/subscribe", {
          method: "POST",
          headers,
          body: JSON.stringify({
            plan,
            billingCycle,
            email: userEmail,
            name: effectiveUserName,
          }),
        });

        const directData = await directRes.json().catch(() => null);

        if (!directRes.ok) {
          throw new Error(directData?.error || "Subscription failed");
        }

        setSubscribedPlan(plan);
        setIsSuccess(true);

        if (onSelectPlan) {
          onSelectPlan(plan, billingCycle);
        }

        if (supabase && accessToken) {
          supabase.auth.refreshSession().catch(() => {});
        }
        return;
      }

      throw new Error(
        paystackData?.error || "Failed to initialize payment with Paystack.",
      );
    } catch (err: any) {
      console.error("Support payment error:", err);
      setErrorMessage(
        err?.message || "Failed to process payment. Please try again.",
      );
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (pendingSelection) {
      handlePlanChoice(
        pendingSelection.plan,
        pendingSelection.billingCycle,
        manualEmail.trim(),
      );
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setSubscribedPlan(null);
    setErrorMessage(null);
    setShowEmailPrompt(false);
    setPendingSelection(null);
    setCurrentStep(0);
    onClose();
  };

  const activePlanConfig = subscribedPlan ? PLAN_CONFIGS[subscribedPlan] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md">

        {/* Modal Drawer Container */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-md h-[100dvh] bg-black overflow-hidden flex flex-col justify-between shadow-2xl"
        >
          {/* Top Control Overlay Navigation */}
          <div className="absolute top-4 inset-x-4 z-40 flex items-center justify-between pointer-events-none">
            <div />

            <button
              onClick={handleResetAndClose}
              aria-label="Close drawer"
              className="p-2 text-neutral-400 hover:text-white transition-colors pointer-events-auto ml-auto text-xs font-semibold uppercase tracking-wider"
            >
              {isSuccess ? "Close" : "Skip"}
            </button>
          </div>

          {/* Screen Renderer */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {isSuccess ? (
                /* Success & Verification Confirmation Screen */
                <motion.div
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col items-center justify-center p-6 text-center text-white space-y-6"
                >
                  <div className="size-20 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-900/40">
                    <CheckCircle2 className="size-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black tracking-tight">
                      Welcome, Partner! ❤️
                    </h3>
                    <p className="text-sm text-neutral-300 max-w-xs mx-auto">
                      Your subscription as a{" "}
                      <span className="font-bold text-white capitalize">
                        {subscribedPlan}
                      </span>{" "}
                      has been confirmed and stored.
                    </p>
                  </div>

                  {/* Verification Badge Showcase */}
                  {activePlanConfig?.showVerifiedIcon && (
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 w-full max-w-xs shadow-inner">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500">
                        Your Verification Status
                      </span>
                      <div className="flex items-center justify-center gap-1.5 py-1">
                        <span className="text-sm font-bold text-white">
                          {effectiveUserName}
                        </span>
                        <VerifiedBadge
                          tier={subscribedPlan}
                          size="md"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        Your badge is now active across comments, visitors, and community features.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleResetAndClose}
                    className="w-full max-w-xs py-3.5 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-950/50 transition-all cursor-pointer"
                  >
                    Continue to Devotional
                  </button>
                </motion.div>
              ) : currentStep === 0 ? (
                /* Intro Step */
                <motion.div
                  key="intro-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <SupportIntroScreen
                    onNext={handleNextStep}
                    currentStep={0}
                    totalSteps={2}
                  />
                </motion.div>
              ) : (
                /* Plan Carousel Step */
                <motion.div
                  key="plan-cards-carousel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="h-full relative"
                >
                  <SupportPlanCard
                    initialPlanType="reader"
                    userName={effectiveUserName}
                    onSelectPlan={(plan, cycle) => handlePlanChoice(plan, cycle)}
                  />

                  {/* Email Prompt Modal for Unauthenticated Users */}
                  {showEmailPrompt && (
                    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="size-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                        <CreditCard className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">
                          Paystack Checkout
                        </h4>
                        <p className="text-xs text-neutral-400 max-w-xs">
                          Enter your email to receive payment receipts and activate your verified badge.
                        </p>
                      </div>

                      <form onSubmit={handleEmailSubmit} className="w-full max-w-xs space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 size-4 text-neutral-500" />
                          <input
                            type="email"
                            required
                            placeholder="your.email@example.com"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowEmailPrompt(false)}
                            className="flex-1 py-3 rounded-xl border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-950/50"
                          >
                            Pay with Paystack
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Error Toast Notification if API fails */}
                  {errorMessage && (
                    <div className="absolute bottom-24 inset-x-4 z-50 p-3 bg-red-950/95 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2 shadow-2xl">
                      <AlertCircle className="size-4 shrink-0 text-red-400" />
                      <span className="flex-1">{errorMessage}</span>
                      <button
                        onClick={() => setErrorMessage(null)}
                        className="text-neutral-400 hover:text-white text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Subscribing Loading Overlay */}
                  {isSubscribing && (
                    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="size-8 text-red-500 animate-spin" />
                      <p className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                        Connecting to Paystack...
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};

export default SupportModalDrawer;
