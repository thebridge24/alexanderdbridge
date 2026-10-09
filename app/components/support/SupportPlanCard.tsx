"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    verifiedIconColor: "text-red-500",
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
    verifiedIconColor: "text-blue-500",
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
    verifiedIconColor: "text-purple-500",
    imagePlaceholderPath:
      "https://res.cloudinary.com/glqzvvh2/image/upload/v1791524488/Photoroom-20261009_063401_vghz3k.png",
  },
};

const PLANS_ARRAY: PlanType[] = ["reader", "supporter", "sponsor"];

// X (Twitter) Scalloped Verified Badge Component
const XVerifiedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-label="Verified"
    className={className}
    fill="currentColor"
  >
    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-3.98s-2.59-1.27-3.98-.81C14.67 2.56 13.43 1.68 12 1.68s-2.67.88-3.34 2.19c-1.39-.46-2.97-.2-3.98.81s-1.27 2.59-.81 3.98C2.56 9.33 1.68 10.57 1.68 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 3.98s2.59 1.27 3.98.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.97.2 3.98-.81s1.27-2.59.81-3.98c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.33 2.33 4.86-4.86 1.41 1.42-6.27 6.27z" />
  </svg>
);

interface SupportPlanCardProps {
  initialPlanType?: PlanType;
  userName?: string;
  onSelectPlan: (plan: PlanType) => void;
}

export const SupportPlanCard: React.FC<SupportPlanCardProps> = ({
  initialPlanType = "reader",
  userName = "Alexander",
  onSelectPlan,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(() => {
    const foundIndex = PLANS_ARRAY.indexOf(initialPlanType);
    return foundIndex !== -1 ? foundIndex : 0;
  });

  const activePlanKey = PLANS_ARRAY[activeIndex];
  const activePlan = PLAN_CONFIGS[activePlanKey];

  const handleNext = () => {
    if (activeIndex < PLANS_ARRAY.length - 1) setActiveIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex((prev) => prev - 1);
  };

  return (
    <div className="relative h-full min-h-[100dvh] bg-white p-3 sm:p-4 text-neutral-900 flex flex-col justify-between overflow-x-hidden">
      
      {/* Dynamic Carousel Container (Colored Cards Peek Left & Right) */}
      <div className="relative w-full flex-1 min-h-[58vh] flex items-center justify-center my-auto">
        <div className="relative w-full h-full min-h-[56vh] flex items-center justify-center">
          {PLANS_ARRAY.map((planKey, index) => {
            const plan = PLAN_CONFIGS[planKey];
            const isCurrent = index === activeIndex;
            const offset = index - activeIndex;

            if (Math.abs(offset) > 1) return null;

            return (
              <motion.div
                key={plan.id}
                className={`absolute inset-0 w-full h-full ${plan.heroBgClass} rounded-[28px] sm:rounded-[36px] flex flex-col justify-between overflow-hidden text-white shadow-2xl cursor-pointer`}
                initial={false}
                animate={{
                  x: `${offset * 88}%`,
                  scale: isCurrent ? 0.8 : 0.68,
                  opacity: isCurrent ? 1 : 0.65,
                  zIndex: isCurrent ? 20 : 10,
                }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 26,
                }}
                drag={isCurrent ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) handleNext();
                  if (info.offset.x > 50) handlePrev();
                }}
                onClick={() => setActiveIndex(index)}
              >
                {/* Subtle Overlay Pattern */}
                <div className="absolute inset-0 bg-white/5 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.12)_50%,transparent_75%)] bg-[length:250px_250px] pointer-events-none" />

                {/* Card Content */}
                <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-between gap-4">
                  {/* Step Indicators */}
                  <div className="flex items-center gap-1.5">
                    {PLANS_ARRAY.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          idx === activeIndex
                            ? "w-6 bg-white"
                            : "w-1.5 bg-white/35"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Plan Details */}
                  <div className="pt-2 space-y-1">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none opacity-95">
                      {plan.badge}
                    </h1>

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

                {/* Illustration Bottom Bleed */}
                <div className="relative z-10 w-full mt-auto flex items-end">
                  <img
                    src={plan.imagePlaceholderPath}
                    alt={`${plan.badge} illustration`}
                    className="w-full h-auto max-h-[30vh] sm:max-h-[34vh] object-contain object-bottom transition-transform duration-500 pointer-events-none select-none"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Bottom Controls */}
      <div className="relative z-30 bg-white rounded-[24px] sm:rounded-[28px] w-full flex flex-col justify-between shrink-0 space-y-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePlan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* User Tag & Description with X Verified Icon */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                <span className="text-[11px] font-medium text-neutral-700">
                  For {userName}
                </span>
                <XVerifiedIcon
                  className={`w-4 h-4 ${activePlan.verifiedIconColor}`}
                />
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed pt-0.5">
                {activePlan.description}
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-1">
              <button
                onClick={() => onSelectPlan(activePlanKey)}
                className="w-full py-3.5 px-5 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-full transition-all flex items-center justify-center group"
              >
                <span>{activePlan.buttonText}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
