"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronRight } from "lucide-react";


// ==========================================
// 1. TYPES & CONTENT BREAKDOWN (21 STEPS)
// ==========================================

interface SlideContent {
  id: number;
  badge?: string;
  headline?: string;
  leadParagraph?: string;
  subParagraphs?: string[];
  highlightText?: string;
  isOpening?: boolean;
  isClosing?: boolean;
}

const APOLOGY_SLIDES: SlideContent[] = [
  {
    id: 1,
    isOpening: true,
    badge: "A MESSAGE FOR",
    headline: "Hey, Mr. Marvin.",
    leadParagraph:
      "I've been thinking a lot about everything that has happened between us, and I felt I needed to reach out to you.",
  },
  {
    id: 2,
    badge: "2023 — THE BEGINNING",
    headline: "Where it all started.",
    leadParagraph:
      "Sometimes I look back at how we started in 2023, when you met me as Matheverse, teaching mathematics on TikTok...",
  },
  {
    id: 3,
    badge: "2024 — THE TURNING POINT",
    headline: "You introduced me to web development.",
    leadParagraph: "Before meeting you, I knew nothing about coding.",
    subParagraphs: [
      "You gave me an opportunity, taught me, supported me financially, and helped me get to where I am today.",
    ],
  },
  {
    id: 4,
    badge: "ACKNOWLEDGEMENT",
    headline: "I would not be here without you.",
    leadParagraph:
      "Honestly, I would not be where I am in tech today if I had not met you.",
    highlightText:
      "I have not forgotten all you did for me, and I am truly grateful.",
  },
  {
    id: 5,
    badge: "SELF-REFLECTION",
    headline: "Looking back with honesty.",
    leadParagraph:
      "Lately, I've been reflecting on how things turned out between us, and I've come to realize that I may have made some mistakes.",
  },
  {
    id: 6,
    badge: "STACKGATE INTERNATIONAL",
    headline: "I was so passionate about building.",
    leadParagraph:
      "I was so focused on building something of my own and starting Stackgate International that I didn't really consider how you felt about it or how it might affect our relationship.",
  },
  {
    id: 7,
    badge: "INTENTION vs REALITY",
    headline: "My intentions were never to leave.",
    leadParagraph:
      "In my mind, I thought I could build my company and still continue working with you as we had always done.",
    subParagraphs: [
      "I never intended to leave you behind or make you feel like I was no longer interested in working with you.",
    ],
  },
  {
    id: 8,
    badge: "PERSPECTIVE",
    headline: "A blind spot in my thinking.",
    leadParagraph:
      "But looking back now, I realize there may have been things I didn't understand...",
    highlightText:
      "I wish I had taken the time to understand your own perspective instead of assuming things.",
  },
  {
    id: 9,
    badge: "THE DISTANCE",
    headline: "When communication faded.",
    leadParagraph:
      "When the projects stopped coming and I wasn't getting responses to my messages, I became hurt and confused.",
  },
  {
    id: 10,
    badge: "MY REGRET",
    headline: "I handled things wrongly.",
    leadParagraph:
      "I started seeing things differently, and eventually, I blocked you on WhatsApp and removed you from my group.",
    subParagraphs: [
      "Now that I think about it, I know I shouldn't have handled things that way.",
    ],
    highlightText: "I'm sorry, sir.",
  },
  {
    id: 11,
    badge: "THE REALIZATION",
    headline: "Too focused on my own plans.",
    leadParagraph:
      "I think I was too focused on my own plans and expectations, and I didn't fully appreciate the relationship and the opportunity I had.",
  },
  {
    id: 12,
    badge: "UNSPOKEN TRUTHS",
    headline: "Things I still need to learn.",
    leadParagraph:
      "Maybe there were things I should have done differently, and maybe there are things I still don't understand.",
    highlightText:
      "But one thing I know is that I never intended to hurt or disappoint you.",
  },
  {
    id: 13,
    badge: "SINCERE APOLOGY",
    headline: "I am genuinely sorry.",
    leadParagraph:
      "Mr. Marvin, I'm genuinely sorry for whatever I did that offended you or made you feel disappointed in me.",
  },
  {
    id: 14,
    badge: "YOUR SIDE",
    headline: "I want to hear from you.",
    leadParagraph: "I don't want to assume I know how you feel...",
    subParagraphs: [
      "Which is why I would really appreciate hearing your own side of the story.",
    ],
  },
  {
    id: 15,
    badge: "WORKING TOGETHER",
    headline: "If there is still room.",
    leadParagraph:
      "If there is still room for me to work with you and learn under you again, I would be grateful.",
  },
  {
    id: 16,
    badge: "PURPOSE OF THIS MESSAGE",
    headline: "It's about making things right.",
    leadParagraph:
      "I'm not reaching out because I want projects or money from you.",
    highlightText:
      "I just want to make things right between us, and if you are willing, I would love to continue learning from you.",
  },
  {
    id: 17,
    badge: "GRATITUDE",
    headline: "Thank you for everything.",
    leadParagraph:
      "Thank you for everything you have done for me. I know I may not have shown enough appreciation, but I have not forgotten.",
  },
  {
    id: 18,
    badge: "THE PAIN OF SEPARATION",
    headline: "It hurts that things are like this.",
    leadParagraph:
      "It genuinely hurts me that things have turned out this way between us...",
    subParagraphs: [
      "And I don't want to leave everything like this without making an effort to reach out.",
    ],
  },
  {
    id: 19,
    badge: "WHEN YOU'RE READY",
    headline: "No rush.",
    leadParagraph:
      "Whenever you are ready, I would really love to hear what you think and understand how you see everything that has happened.",
  },
  {
    id: 20,
    badge: "FINAL WORDS",
    headline: "I'm sorry, sir.",
    leadParagraph: "Thank you for taking the time to read this.",
    subParagraphs: ["— Alexander"],
  },
  {
    id: 21,
    isClosing: true,
    badge: "A RESPECTFUL PLEA",
    headline: "Can we have a short conversation?",
    leadParagraph:
      "I would really love the opportunity to talk through things whenever you have a few minutes.",
  },
];

// ==========================================
// 2. FRAMER MOTION VARIANTS
// ==========================================

const pageVariants: Variants = {
  initial: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 28 : -28,
    filter: "blur(12px)",
  }),
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -20 : 20,
    filter: "blur(10px)",
    transition: {
      duration: 0.45,
      ease: [0.7, 0, 0.84, 0],
    },
  }),
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function ApologyPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [isClickLocked, setIsClickLocked] = useState<boolean>(false);
  const [declinedOffer, setDeclinedOffer] = useState<boolean>(false);

  const totalSteps = APOLOGY_SLIDES.length;
  const slide = APOLOGY_SLIDES[currentStep];

  const whatsappMessage = encodeURIComponent(
    "Hey Alex, I got your message and I'm ready for us to have a call."
  );
  const whatsappUrl = `https://wa.me/2348156688188?text=${whatsappMessage}`;

  const goToNext = useCallback(() => {
    if (isClickLocked) return;
    if (currentStep < totalSteps - 1) {
      setIsClickLocked(true);
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      setTimeout(() => setIsClickLocked(false), 550);
    }
  }, [currentStep, totalSteps, isClickLocked]);

  const goToPrev = useCallback(() => {
    if (isClickLocked) return;
    if (currentStep > 0) {
      setIsClickLocked(true);
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      setTimeout(() => setIsClickLocked(false), 550);
    }
  }, [currentStep, isClickLocked]);

  const restart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeclinedOffer(false);
    setDirection(-1);
    setCurrentStep(0);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  return (
    <div
      onClick={currentStep === totalSteps - 1 ? undefined : goToNext}
      className="relative w-screen h-screen overflow-hidden bg-white text-[#111111] select-none font-sans cursor-pointer antialiased"
    >
      {/* Top Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-neutral-100 z-30">
        <motion.div
          className="h-full bg-red-600"
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentStep + 1) / totalSteps) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header bar */}
      <header className="absolute top-8 left-8 right-8 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-3">
          <span className="w-2 h-2 rounded-full bg-red-600" />
          <span className="text-xs font-semibold tracking-widest text-[#111111] uppercase font-mono">
            LETTER TO MR. MARVIN
          </span>
        </div>

        <div className="text-xs font-mono tracking-widest text-neutral-400">
          <span>{String(currentStep + 1).padStart(2, "0")}</span>
          <span className="mx-1 text-neutral-300">/</span>
          <span>{String(totalSteps).padStart(2, "0")}</span>
        </div>
      </header>

      {/* Main Viewport Content Container */}
      <main className="w-full h-full flex items-center justify-center px-8 md:px-16 lg:px-24">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-3xl flex flex-col justify-center relative z-10 my-auto"
          >
            {/* Category / Section Badge */}
            {slide.badge && (
              <motion.div variants={itemVariants} className="mb-4">
                <span className="inline-block text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-red-600">
                  {slide.badge}
                </span>
              </motion.div>
            )}

            {/* Headline */}
            {slide.headline && (
              <motion.h1
                variants={itemVariants}
                className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111111] leading-[1.12] mb-8"
              >
                {slide.headline}
              </motion.h1>
            )}

            {/* Main Lead Text */}
            {slide.leadParagraph && (
              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-2xl lg:text-3xl text-neutral-600 font-normal leading-relaxed mb-6"
              >
                {slide.leadParagraph}
              </motion.p>
            )}

            {/* Additional Paragraphs */}
            {slide.subParagraphs && (
              <div className="space-y-4 mb-6">
                {slide.subParagraphs.map((sub, idx) => (
                  <motion.p
                    key={idx}
                    variants={itemVariants}
                    className="text-base sm:text-xl text-neutral-500 font-light leading-relaxed"
                  >
                    {sub}
                  </motion.p>
                ))}
              </div>
            )}

            {/* Highlighted Callout Text */}
            {slide.highlightText && (
              <motion.div
                variants={itemVariants}
                className="mt-4 p-6 sm:p-8 bg-neutral-50 border-l-2 border-red-600 rounded-r-xl"
              >
                <p className="text-base sm:text-xl text-[#111111] font-medium leading-relaxed">
                  "{slide.highlightText}"
                </p>
              </motion.div>
            )}

            {/* STEP 1: Interactive Click Simulator */}
            {slide.isOpening && (
              <motion.div
                variants={itemVariants}
                className="mt-12 flex flex-col items-start space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <motion.div
                      animate={{ scale: [1, 0.75, 1] }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-10 h-10 rounded-full border border-red-600/40 bg-red-600/10 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ scale: [0.8, 1, 0.8] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="w-4 h-4 rounded-full bg-red-600"
                      />
                    </motion.div>
                  </div>

                  <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                    Tap or click anywhere to read
                  </span>
                </div>
              </motion.div>
            )}

            {/* FINAL STEP: Action Options */}
            {slide.isClosing && (
              <motion.div variants={itemVariants} className="mt-8 space-y-6">
                {!declinedOffer ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    {/* Schedule Call Button -> WhatsApp */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-mono text-xs tracking-widest uppercase font-semibold transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      <span>Schedule a Call</span>
                      <span className="ml-2"> <ChevronRight className="size-5"/></span>
                    </a>

                    {/* Decline Option Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeclinedOffer(true);
                      }}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-full border border-neutral-200 hover:border-neutral-400 text-neutral-500 font-mono text-xs tracking-widest uppercase font-medium transition-all active:scale-95"
                    >
                      Not ready right now
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4"
                  >
                    <p className="text-base text-neutral-600 font-light">
                      I completely understand and respect your decision, sir. Whenever you feel ready, my door remains open.
                    </p>
                    <button
                      onClick={restart}
                      className="text-xs font-mono tracking-widest text-red-600 uppercase underline underline-offset-4"
                    >
                      Read from beginning again
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation Indicator */}
      {currentStep < totalSteps - 1 && (
        <footer className="absolute bottom-8 inset-x-0 z-30 flex justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex items-center space-x-3 text-[11px] font-mono tracking-widest text-neutral-400 uppercase"
          >
            <span>Click to continue</span>
            <span className="text-red-600 font-bold">→</span>
          </motion.div>
        </footer>
      )}
    </div>
  );
}
