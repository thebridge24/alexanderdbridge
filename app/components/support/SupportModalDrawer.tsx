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

  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
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
          <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
            {currentStep > 0 ? (
              <button
                onClick={handlePrevStep}
                aria-label="Previous step"
                className="p-2 rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors pointer-events-auto backdrop-blur-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-2 rounded-full bg-black/40 border border-white/20 text-white hover:bg-black/60 transition-colors pointer-events-auto backdrop-blur-md ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Swipeable Dynamic Screen Renderer */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <SupportIntroScreen
                    onNext={handleNextStep}
                    currentStep={0}
                    totalSteps={4}
                  />
                </motion.div>
              )}

              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <SupportPlanCard
                    planType="reader"
                    userName={userName}
                    onSelectPlan={handlePlanChoice}
                    currentStep={1}
                    totalSteps={4}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <SupportPlanCard
                    planType="supporter"
                    userName={userName}
                    onSelectPlan={handlePlanChoice}
                    currentStep={2}
                    totalSteps={4}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <SupportPlanCard
                    planType="sponsor"
                    userName={userName}
                    onSelectPlan={handlePlanChoice}
                    currentStep={3}
                    totalSteps={4}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Chevron Navigation Arrows */}
          {currentStep < 3 && (
            <button
              onClick={handleNextStep}
              aria-label="Next plan"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </motion.div>

      </div>
    </AnimatePresence>
  );
};
