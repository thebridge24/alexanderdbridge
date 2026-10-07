"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SurveyConfig, Answers } from "@/types/survey";
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
    return true;
  };

  const handleNext = async () => {
    if (!isCurrentValid()) return;

    if (step < totalQuestions - 1) {
      setDirection(1);
      setStep((prev) => prev + 1);
    } else {
      // Last question completed
      setIsSubmitting(true);
      try {
        await onSubmit(answers);
        setStep(-2); // Go to Completion screen
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
      x: dir > 0 ? 40 : -40,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
      scale: 0.98,
    }),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Background card stack layer simulating image reference depth */}
      <div className="relative w-full max-w-lg">
        <div className="absolute inset-0 translate-y-3 scale-[0.96] rounded-3xl bg-neutral-900/40 border border-neutral-800/50 pointer-events-none" />
        <div className="absolute inset-0 translate-y-1.5 scale-[0.98] rounded-3xl bg-neutral-900/60 border border-neutral-800/80 pointer-events-none" />

        {/* Main Card Container */}
        <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-red-950/10 flex flex-col min-h-[480px] justify-between overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between mb-6">
            {step >= 0 && step < totalQuestions ? (
              /* Segmented Progress Indicator matched to reference image */
              <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                {config.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      idx <= step ? "bg-red-600" : "bg-neutral-800"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                AlexanderTheBridge
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors ml-auto"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col justify-center my-auto py-2">
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
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-red-500 bg-red-950/40 border border-red-900/50 px-2.5 py-1 rounded-full">
                    {config.intro.subheading}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                    {config.intro.heading}
                  </h2>
                  <div className="space-y-3 text-neutral-300 text-sm md:text-base leading-relaxed">
                    {config.intro.description.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setDirection(1);
                        setStep(0);
                      }}
                      className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
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
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-5"
                >
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                      Question {String(step + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl md:text-2xl font-bold text-white mt-1 leading-snug">
                      {currentQuestion.title}
                    </h3>
                    {currentQuestion.description && (
                      <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 mt-2">
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center py-6 space-y-4 flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500 flex items-center justify-center text-red-500 mb-2"
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {config.completion.title}
                  </h2>
                  <p className="text-neutral-300 text-sm md:text-base leading-relaxed max-w-sm">
                    {config.completion.message}
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-xl text-sm transition-colors"
                    >
                      Close Window
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          {step >= 0 && step < totalQuestions && (
            <div className="flex items-center justify-between pt-6 border-t border-neutral-900">
              <button
                onClick={handleBack}
                className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1 py-2 px-3"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={handleNext}
                disabled={!isCurrentValid() || isSubmitting}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  isCurrentValid() && !isSubmitting
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : step === totalQuestions - 1 ? (
                  "Submit"
                ) : (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
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
