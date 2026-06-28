/* eslint-disable react-hooks/set-state-in-effect */
// src/components/DevotionalView.tsx
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  DEVOTIONALS_DATA,
  MONTH_THEME,
  type Devotional,
} from "../data/devotionalData";

interface DevotionalViewProps {
  onClose: () => void;
}

type IntroStage = "logo" | "day" | "theme" | "content";

/* ==========================================================================
   Framer Motion Variant Configurations
   ========================================================================== */
const screenVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.5 } },
};

const cinematicVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1.0] },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(10px)",
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

const contentContainerVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", delay: 0.2 },
  },
};

export default function DevotionalView({ onClose }: DevotionalViewProps) {
  const [stage, setStage] = useState<IntroStage>("logo");
  const [todaysDevotional, setTodaysDevotional] = useState<Devotional | null>(
    null,
  );

  useEffect(() => {
    // Exact runtime parsing setup for match verification (YYYY-MM-DD)
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    const targetKey = localDate.toISOString().split("T")[0];

    const matched = DEVOTIONALS_DATA.find((d) => d.dateString === targetKey);
    setTodaysDevotional(matched || null);

    // Automated Intro Sequential Timing Delays
    const timer1 = setTimeout(() => setStage("day"), 1800);
    const timer2 = setTimeout(() => setStage("theme"), 3600);
    const timer3 = setTimeout(() => setStage("content"), 5400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <motion.div
      variants={screenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[200] bg-black text-white flex flex-col items-center justify-center overflow-y-auto select-none px-6 py-12 font-"
    >
      <AnimatePresence mode="wait">
        {/* Stage 1: Brand Wordmark / Title */}
        {stage === "logo" && (
          <motion.h2
            key="logo-stage"
            variants={cinematicVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-2xl font-light tracking-[0.25em] uppercase text-neutral-200"
          >
            Devotional
          </motion.h2>
        )}

        {/* Stage 2: Day Index Milestone Counter */}
        {stage === "day" && (
          <motion.div
            key="day-stage"
            variants={cinematicVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center"
          >
            <span className="text-[11px] tracking-widest text-neutral-500 uppercase block mb-1 font-medium">
              Current Milestone
            </span>
            <h3 className="text-4xl font-semibold tracking-tight">
              Day {todaysDevotional ? todaysDevotional.dayNumber : "---"}
            </h3>
          </motion.div>
        )}

        {/* Stage 3: Monthly Theme Reveal */}
        {stage === "theme" && (
          <motion.div
            key="theme-stage"
            variants={cinematicVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-center max-w-sm px-4"
          >
            <span className="text-[11px] tracking-widest text-neutral-500 uppercase block mb-2 font-medium">
              Theme of the Month
            </span>
            <p className="text-lg font-light tracking-wide text-neutral-200 leading-relaxed">
              "{MONTH_THEME}"
            </p>
          </motion.div>
        )}

        {/* Stage 4: Premium Micro-Typography Core Reader layout */}
        {stage === "content" && (
          <motion.div
            key="content-stage"
            variants={contentContainerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md mx-auto flex flex-col min-h-full justify-between select-text text-left"
          >
            {/* Header Control Panel */}
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4 mb-6">
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-900 rounded-full transition text-neutral-400 hover:text-white"
                aria-label="Exit Devotional"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>{" "}
              <div>
                <p className="text-xs text-neutral-500 tracking-wider font-semibold uppercase">
                  DAY {todaysDevotional?.dayNumber} &bull;{" "}
                  {todaysDevotional?.displayDate}
                </p>
              </div>
            </div>

            {/* Content Switch Engine */}
            {todaysDevotional ? (
              <div className="space-y-6 flex-1 pr-1">
                {/* Topic & Verse Text Identification */}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5 leading-snug">
                    {todaysDevotional.topic}
                  </h1>
                  <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                    Scripture Anchor: {todaysDevotional.text}
                  </p>
                </div>

                {/* Memory Verse Block Quote */}
                <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold block">
                    Memory Verse
                  </span>
                  <p className="text-sm italic text-neutral-300 font-light leading-relaxed">
                    {todaysDevotional.memoryVerse.verse}
                  </p>
                  <span className="text-xs text-neutral-400 block text-right font-medium">
                    — {todaysDevotional.memoryVerse.reference}
                  </span>
                </div>

                {/* Main Explanation Block */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                    Explanation
                  </h4>
                  <p className="text-sm leading-relaxed text-neutral-300 font-normal">
                    {todaysDevotional.explanation}
                  </p>
                </div>

                {/* Split Context Steps & Prayers */}
                <div className="grid grid-cols-1 gap-6 pt-2">
                  <div className="space-y-2.5">
                    <h4 className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                      Needed Steps
                    </h4>
                    <ul className="space-y-1.5 text-sm text-neutral-300 font-normal">
                      {todaysDevotional.neededSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-neutral-500 select-none font-mono font-medium">
                            {index + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                      Prayer Points
                    </h4>
                    <ul className="space-y-1.5 text-sm text-neutral-300 font-normal">
                      {todaysDevotional.prayerPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-neutral-500 select-none font-medium">
                            &bull;
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <p className="text-sm text-neutral-400 font-light">
                  No devotional content scheduled for today's date.
                </p>
              </div>
            )}

            {/* Bottom Footer Accent */}
            <div className="mt-10 border-t border-neutral-900 pt-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-medium">
                Walk in Purpose
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
