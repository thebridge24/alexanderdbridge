"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SupportIntroScreen } from "./SupportIntroScreen";
import { SupportPlanCard, PlanType } from "./SupportPlanCard";

interface SupportModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onSelectPlan?: (plan: PlanType) => void;
}

export const SupportModalDrawer: React.FC<SupportModalDrawerProps> = ({
  isOpen,
  onClose,
  userName = "Alexander",
  onSelectPlan,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handlePlanChoice = (plan: PlanType) => {
    if (onSelectPlan) onSelectPlan(plan);
    onClose();
  };

  // Render card based on step index
  const renderCardContent = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <SupportIntroScreen
            onNext={handleNext}
            currentStep={0}
            totalSteps={4}
          />
        );
      case 1:
        return (
          <SupportPlanCard
            planType="reader"
            userName={userName}
            onSelectPlan={handlePlanChoice}
            currentStep={1}
            totalSteps={4}
          />
        );
      case 2:
        return (
          <SupportPlanCard
            planType="supporter"
            userName={userName}
            onSelectPlan={handlePlanChoice}
            currentStep={2}
            totalSteps={4}
          />
        );
      case 3:
        return (
          <SupportPlanCard
            planType="sponsor"
            userName={userName}
            onSelectPlan={handlePlanChoice}
            currentStep={3}
            totalSteps={4}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md overflow-hidden">
        
        {/* Top Floating Controls */}
        <div className="absolute top-4 inset-x-4 z-50 flex items-center justify-between max-w-md mx-auto pointer-events-none">
          {currentStep > 0 ? (
            <button
              onClick={handlePrev}
              aria-label="Previous step"
              className="p-2.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/80 transition-colors pointer-events-auto backdrop-blur-md shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/80 transition-colors pointer-events-auto backdrop-blur-md ml-auto shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Peeking Scale Carousel Container */}
        <div className="relative w-full max-w-md h-[92dvh] flex items-center justify-center px-6">
          {[-1, 0, 1].map((offset) => {
            const stepIndex = currentStep + offset;
            if (stepIndex < 0 || stepIndex > 3) return null;

            const isCurrent = offset === 0;

            return (
              <motion.div
                key={stepIndex}
                drag={isCurrent ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 && currentStep < 3) handleNext();
                  if (info.offset.x > 60 && currentStep > 0) handlePrev();
                }}
                animate={{
                  x: `${offset * 88}%`,
                  scale: isCurrent ? 1 : 0.88,
                  opacity: isCurrent ? 1 : 0.45,
                  zIndex: isCurrent ? 30 : 10,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                onClick={() => {
                  if (offset === -1) handlePrev();
                  if (offset === 1) handleNext();
                }}
                className={`absolute w-full h-full rounded-[32px] overflow-hidden shadow-2xl transition-shadow ${
                  isCurrent ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                }`}
              >
                {renderCardContent(stepIndex)}
              </motion.div>
            );
          })}
        </div>

      </div>
    </AnimatePresence>
  );
};
