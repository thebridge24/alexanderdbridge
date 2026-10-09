"use client";

import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

export type PlanType = "reader" | "supporter" | "sponsor";

export interface SupportPlanConfig {
  id: PlanType;
  badge: string;
  badgeColor: string;
  price: string;
  heading: string;
  description: string;
  buttonText: string;
  heroBgClass: string;
  badgeBgClass: string;
  badgeTextClass: string;
  verifiedIconColor: string;
  imagePlaceholderPath: string;
}

export const PLAN_CONFIGS: Record<PlanType, SupportPlanConfig> = {
  reader: {
    id: "reader",
    badge: "READER",
    badgeColor: "#ef4444",
    price: "₦500 / month",
    heading: "Stay Connected",
    description:
      "Your membership helps us keep Bridge Daily running while you continue growing through God's Word every day.",
    buttonText: "Become a Reader",
    heroBgClass: "bg-red-500",
    badgeBgClass: "bg-red-100 text-red-600 border-red-200",
    badgeTextClass: "text-red-600",
    verifiedIconColor: "text-red-500 fill-red-500/20",
    imagePlaceholderPath: "/images/support/reader-hero.png",
  },
  supporter: {
    id: "supporter",
    badge: "SUPPORTER",
    badgeColor: "#3b82f6",
    price: "₦1,000 / month",
    heading: "Help Us Grow",
    description:
      "You're doing more than reading. You're helping us improve the platform, build new features, and reach more people with God's Word.",
    buttonText: "Become a Supporter",
    heroBgClass: "bg-blue-500",
    badgeBgClass: "bg-blue-100 text-blue-600 border-blue-200",
    badgeTextClass: "text-blue-600",
    verifiedIconColor: "text-blue-500 fill-blue-500/20",
    imagePlaceholderPath: "/images/support/supporter-hero.png",
  },
  sponsor: {
    id: "sponsor",
    badge: "SPONSOR",
    badgeColor: "#8b5cf6",
    price: "₦1,500 / month",
    heading: "Help Keep the Word Available",
    description:
      "Your support helps cover the cost of keeping Bridge Daily available to our growing community. You're helping us build something that can reach far beyond us.",
    buttonText: "Become a Sponsor",
    heroBgClass: "bg-purple-600",
    badgeBgClass: "bg-purple-100 text-purple-600 border-purple-200",
    badgeTextClass: "text-purple-600",
    verifiedIconColor: "text-purple-500 fill-purple-500/20",
    imagePlaceholderPath: "/images/support/sponsor-hero.png",
  },
};

interface SupportPlanCardProps {
  planType: PlanType;
  userName?: string;
  onSelectPlan: (plan: PlanType) => void;
  currentStep: number;
  totalSteps?: number;
}

export const SupportPlanCard: React.FC<SupportPlanCardProps> = ({
  planType,
  userName = "Alexander",
  onSelectPlan,
  currentStep,
  totalSteps = 4,
}) => {
  const plan = PLAN_CONFIGS[planType];

  return (
    <div className="relative min-h-screen bg-white text-neutral-900 flex flex-col justify-between overflow-hidden">
      
      {/* Top Colored Banner Hero Section (Reference Style) */}
      <div
        className={`relative w-full h-[52vh] sm:h-[55vh] ${plan.heroBgClass} p-6 sm:p-8 flex flex-col justify-between overflow-hidden text-white transition-colors duration-500`}
      >
        {/* Subtle Diagonal Overlay Stripes */}
        <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250px_250px] pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30`}
          >
            ● {plan.badge}
          </span>
          <span className="text-xs font-mono font-semibold text-white/90 bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
            {plan.price}
          </span>
        </div>

        {/* Big Bold Typography Title (Matching ASAP/SAVE/TRUST style) */}
        <div className="relative z-10 my-auto pt-2">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase leading-none opacity-95">
            {plan.badge}
          </h1>
          <p className="text-xs font-medium text-white/80 mt-1 max-w-[240px]">
            {plan.heading}
          </p>
        </div>

        {/* Hero Illustration Placeholder Container */}
        <div className="relative z-10 w-full flex justify-center -mb-4">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
            {/* Custom PNG Image Slot */}
            <img
              src={plan.imagePlaceholderPath}
              alt={`${plan.badge} illustration`}
              className="w-full h-full object-contain drop-shadow-2xl"
              onError={(e) => {
                // Graceful fallback to styled icon placeholder until PNG is added
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Clean White Content Drawer */}
      <div className="relative z-20 bg-white border-t border-neutral-100 rounded-t-3xl -mt-6 pt-6 pb-8 px-6 max-w-md mx-auto w-full flex flex-col justify-between flex-1 space-y-6 shadow-2xl">
        
        {/* Verified User Greeting Tag */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200">
            <span className="text-xs font-medium text-neutral-700">
              For {userName}
            </span>
            <CheckCircle2 className={`w-4 h-4 ${plan.verifiedIconColor}`} />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 leading-snug">
            {plan.heading}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Bottom Call to Action & Step Indicators */}
        <div className="space-y-4 pt-2">
          <button
            onClick={() => onSelectPlan(planType)}
            className="w-full py-3.5 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>{plan.buttonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Pagination Indicators */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? `w-6 ${plan.heroBgClass}`
                    : "w-1.5 bg-neutral-200"
                }`}
              />
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
