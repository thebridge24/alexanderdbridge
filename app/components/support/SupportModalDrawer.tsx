"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const handleNextStep = () => {
    if (currentStep === 0) setCurrentStep(1);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep(0);
  };

  const handlePlanChoice = (plan: PlanType) => {
    if (onSelectPlan) onSelectPlan(plan);
    console.log(`User selected support plan: ${plan}`);
    onClose();
  };

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
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 text-white transition-colors pointer-events-auto ml-auto"
            >
             Skip
            </button>
          </div>

          {/* Screen Renderer */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentStep === 0 ? (
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
                <motion.div
                  key="plan-cards-carousel"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="h-full"
                >
                  <SupportPlanCard
                    initialPlanType="reader"
                    userName={userName}
                    onSelectPlan={handlePlanChoice}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};
