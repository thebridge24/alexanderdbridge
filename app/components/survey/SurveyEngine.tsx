"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SurveyConfig, Answers } from "../../types/survey";
import { FieldRenderer } from "./FieldRenderers";

interface SurveyEngineProps {
  config: SurveyConfig;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Answers) => Promise<void> | void;
}

export const SurveyEngine: React.FC<SurveyEngineProps> = ({
  config,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState<number>(-1); // -1: Intro, -2: Completed
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [direction, setDirection] = useState<number>(1);

  if (!isOpen) return null;

  const totalQuestions = config.questions.length;
  const currentQuestion = step >= 0 && step < totalQuestions ? config.questions[step] : null;

  const handleAnswerChange = (val: any) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
  };

  const isCurrentValid = () => {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;
    const val = answers[currentQuestion.id];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val) && val.length === 0) return false;
    
    // Require text if "Other" is chosen
    if (typeof val === "object" && val?.selected === "other") {
      return val.text && val.text.trim().length > 0;
    }
    if (Array.isArray(val)) {
      const otherObj = val.find((item) => typeof item === "object" && item.selected === "other");
      if (otherObj && (!otherObj.text || otherObj.text.trim().length === 0)) {
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!isCurrentValid()) return;

    if (step < totalQuestions - 1) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      setIsSubmitting(true);
      try {
        await onSubmit(answers);
        setStep(-2);
      } catch (err) {
        console.error("Survey submission failed:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step > -1) {
      setDirection(-1);
      setStep((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      {/* Background card stack layer simulating depth */}
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 translate-y-3 scale-[0.96] rounded-3xl bg-neutral-900/40 border border-neutral-800/50 pointer-events-none" />
        <div className="absolute inset-0 translate-y-1.5 scale-[0.98] rounded-3xl bg-neutral-900/60 border border-neutral-800/80 pointer-events-none" />

        {/* Main Fixed Height Pop-up Card Container */}
        <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl shadow-red-950/10 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
          
          {/* Fixed Header Bar */}
          <div className="flex items-center justify-between p-5 pb-3 border-b border-neutral-900/80 shrink-0">
            {step >= 0 && step < totalQuestions ? (
              <div className="flex items-center gap-1.5 flex-1 max-w-[180px]">
                {config.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                      idx <= step ? "bg-red-600" : "bg-neutral-800"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
             Bridge Daily.
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors ml-auto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Internal Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar">
            <AnimatePresence mode="wait" custom={direction}>
              {/* INTRO SCREEN */}
              {step === -1 && (
                <motion.div
                  key="intro"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-3.5"
                >
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-500 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full mb-2">
                    {config.intro.subheading}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                    {config.intro.heading}
                  </h2>
                  <div className="space-y-2.5 text-neutral-300 text-xs sm:text-sm leading-relaxed">
                    {config.intro.description.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        setDirection(1);
                        setStep(0);
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
                    >
                      {config.intro.buttonText}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* DYNAMIC QUESTION SCREEN */}
              {step >= 0 && step < totalQuestions && currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                      Question {String(step + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 leading-snug">
                      {currentQuestion.title}
                    </h3>
                    {currentQuestion.description && (
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {currentQuestion.description}
                      </p>
                    )}
                  </div>

                  <FieldRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id]}
                    onChange={handleAnswerChange}
                    onSubmitStep={handleNext}
                  />
                </motion.div>
              )}

              {/* COMPLETION SCREEN */}
              {step === -2 && (
                <motion.div
                  key="completion"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-4 space-y-3 flex flex-col items-center my-auto"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-12 h-12 rounded-full bg-red-600/10 border border-red-500 flex items-center justify-center text-red-500"
                  >
                    <Check className="w-6 h-6 stroke-[3]" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {config.completion.title}
                  </h2>
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-xs">
                    {config.completion.message}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={onClose}
                      className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-xs transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fixed Footer Controls */}
          {step >= 0 && step < totalQuestions && (
            <div className="flex items-center justify-between p-4 px-5 border-t border-neutral-900/80 bg-neutral-950/90 backdrop-blur-sm shrink-0">
              <button
                onClick={handleBack}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1 py-1.5 px-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                onClick={handleNext}
                disabled={!isCurrentValid() || isSubmitting}
                className={`px-5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isCurrentValid() && !isSubmitting
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/40"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : step === totalQuestions - 1 ? (
                  "Submit"
                ) : (
                  <>
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
