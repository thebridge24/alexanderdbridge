"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SupportIntroScreen } from "./SupportIntroScreen";
import { SupportPlanCard, PlanType, BillingCycle, PLAN_CONFIGS } from "./SupportPlanCard";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

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
   * Internal Self-Contained Subscription API Handler
   * Anywhere this drawer is invoked, choosing a plan persists directly to the backend.
   */
  const handlePlanChoice = async (
    plan: PlanType,
    billingCycle: BillingCycle = "monthly",
  ) => {
    setIsSubscribing(true);
    setErrorMessage(null);

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

      const res = await fetch("/api/support/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan,
          billingCycle,
          email: currentUser?.email,
          name: effectiveUserName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `Subscription failed with status ${res.status}`);
      }

      // Success
      setSubscribedPlan(plan);
      setIsSuccess(true);

      if (onSelectPlan) {
        onSelectPlan(plan, billingCycle);
      }

      // Refresh auth user session if available to pick up updated user_metadata
      if (supabase && accessToken) {
        supabase.auth.refreshSession().catch(() => {});
      }
    } catch (err: any) {
      console.error("Support subscription error:", err);
      setErrorMessage(err?.message || "Failed to process subscription. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setSubscribedPlan(null);
    setErrorMessage(null);
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
                    onSelectPlan={handlePlanChoice}
                  />

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
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="size-8 text-red-500 animate-spin" />
                      <p className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                        Processing Subscription...
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
