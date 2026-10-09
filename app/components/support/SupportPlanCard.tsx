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
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524487/Photoroom-20261009_063821_hgo5tu.png",
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
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524487/Photoroom-20261009_063427_okept4.png",
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
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524488/Photoroom-20261009_063401_vghz3k.png",
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
    <div className="relative h-full min-h-[100dvh] bg-white p-3 sm:p-4 text-neutral-900 flex flex-col justify-between overflow-y-auto">
      
      {/* Main Rounded Colored Hero Card (No outer padding, overflow-hidden) */}
      <div
        className={`relative w-full flex-1 min-h-[58vh] ${plan.heroBgClass} rounded-[28px] sm:rounded-[36px] flex flex-col justify-between overflow-hidden text-white transition-colors duration-500 mb-3`}
      >
        {/* Subtle Diagonal Overlay Stripes */}
        <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.12)_50%,transparent_75%)] bg-[length:250px_250px] pointer-events-none" />

        {/* Padded Content Wrapper for Top Controls & Typography */}
        <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-between gap-4">
          
          {/* Top Bar: Pagination Indicators + Badge */}
          <div className="flex items-center justify-between">
            {/* Pagination Indicators (Positioned directly above plan name) */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/35"
                  }`}
                />
              ))}
            </div>

          </div>

          {/* Big Bold Plan Name & Prominent Price Tag */}
          <div className="pt-2 space-y-1">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none opacity-95">
              {plan.badge}
            </h1>

            {/* Prominent Price Display */}
            <div className="pt-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight drop-shadow-md">
                {plan.price}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-white/85 pt-1 max-w-[280px]">
              {plan.heading}
            </p>
          </div>
        </div>

        {/* Full-Width Bottom Bleed Illustration (Appears coming from inside bottom edge) */}
        <div className="relative z-10 w-full mt-auto flex items-end">
          <img
            src={plan.imagePlaceholderPath}
            alt={`${plan.badge} illustration`}
            className="w-full h-auto max-h-[30vh] sm:max-h-[34vh] object-contain object-bottom transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Compact White Bottom Drawer Controls */}
      <div className="relative z-20 bg-white rounded-[24px] sm:rounded-[28px] w-full flex flex-col justify-between shrink-0 space-y-4">
        
        {/* Verified User Tag & Description */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
            <span className="text-[11px] font-medium text-neutral-700">
              For {userName}
            </span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${plan.verifiedIconColor}`} />
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed pt-0.5">
            {plan.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={() => onSelectPlan(planType)}
            className="w-full py-3.5 px-5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center group"
          >
            <span>{plan.buttonText}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
