"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  RotateCcw,
  Sparkles,
  Heart,
  Mail,
  Volume2,
  VolumeX,
} from "lucide-react";

// ==========================================
// 1. CONFIGURATION & DATA STRUCTURE
// ==========================================

interface SlideData {
  id: number;
  title?: string;
  subtitle?: string;
  paragraphs?: string[];
  listItems?: string[];
  image?: string;
  imageAlt?: string;
  imagePosition?: "left" | "right" | "top" | "bottom" | "bg" | "center";
  layout?: "envelope" | "minimal" | "split" | "centered" | "final";
  accentText?: string;
  footerText?: string;
}

const IMAGES = {
  praiz1:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967252/1790966602745_hqkcih.jpg",
  praiz2:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967254/1790966695867_krut43.jpg",
  praiz3:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967252/1790966614721_yae7xp.jpg",
  praiz4:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967256/1790966763608_usonkh.jpg",
  praiz5:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967257/1790966801602_f1jtu3.jpg",
  // 6th image spot pointing to praiz1 as secondary featured photo
  praiz6:
    "https://res.cloudinary.com/dd5ppwbyi/image/upload/v1790967252/1790966602745_hqkcih.jpg",
};

const SLIDES: SlideData[] = [
  {
    id: 1,
    layout: "envelope",
    title: "Before you turn 18...",
    subtitle: "I asked you a few questions.",
    paragraphs: ["And your answers told me more than I expected."],
    accentText: "A message for Praiz Imonin",
  },
  {
    id: 2,
    layout: "split",
    title: "17 left you with a few things.",
    listItems: [
      "Learning to feel without being ruled by your feelings.",
      "Being scared and still trying.",
      "Taking your health seriously.",
      "And learning that you're not behind.",
    ],
    image: IMAGES.praiz1,
    imageAlt: "Praiz",
    imagePosition: "right",
  },
  {
    id: 3,
    layout: "centered",
    title: "You're not behind.",
    paragraphs: [
      "Someone may get somewhere before you. Someone else may get there after you.",
      "Your journey is still yours.",
      "I hope you remember that when 18 gets loud.",
    ],
    image: IMAGES.praiz2,
    imagePosition: "bg",
  },
  {
    id: 4,
    layout: "split",
    title: "You're still learning yourself.",
    paragraphs: [
      "You're learning that being alone doesn't always mean something is missing.",
      "Sometimes you just need to sit with yourself, breathe, and become comfortable with your own company.",
      "And learning not to rush into friendships just because silence feels uncomfortable.",
    ],
    image: IMAGES.praiz3,
    imageAlt: "Praiz reflective moment",
    imagePosition: "left",
  },
  {
    id: 5,
    layout: "minimal",
    title: "Then I asked you who you want to become.",
    listItems: [
      "A daughter her parents are proud of.",
      "A sister her siblings love and respect.",
      "A friend who makes people glad they met her.",
      "A mother her children can completely trust.",
      "A wife her partner keeps thanking God for.",
    ],
    accentText: "The future woman",
  },
  {
    id: 6,
    layout: "split",
    title: "And then there's the dream.",
    paragraphs: [
      "You don't only want to care for people's bodies through nursing and psychology.",
      "You want your life and your work to point people toward Christ too.",
      "I think that's a beautiful thing to carry into your future.",
    ],
    image: IMAGES.praiz4,
    imageAlt: "Praiz dreaming big",
    imagePosition: "right",
  },
  {
    id: 7,
    layout: "centered",
    title: "You're grateful for two things.",
    accentText: "HEALTH & PEOPLE",
    paragraphs: [
      "Working at UBTH made you see how easy it is to overlook something as precious as being well.",
      "And then there's the people God has placed around you — the ones who teach you, challenge you, love you, and even the ones who taught you through difficult moments.",
    ],
    image: IMAGES.praiz5,
    imagePosition: "bg",
  },
  {
    id: 8,
    layout: "split",
    title: "18.",
    paragraphs: [
      "A new year doesn't mean you suddenly have everything figured out.",
      "Maybe this year is about clarity.",
      "Clarity about who you are. Clarity about what matters. Clarity about the people you keep close. Clarity about where God is leading you.",
      "I pray God gives you that clarity.",
    ],
    image: IMAGES.praiz6,
    imageAlt: "Praiz turning 18",
    imagePosition: "right",
  },
  {
    id: 9,
    layout: "minimal",
    title: "A little from me...",
    paragraphs: [
      "Praiz, I don't know everything this next chapter will bring you.",
      "But I hope you never lose the part of you that keeps asking questions, learning, caring and trying.",
      "I hope God protects your heart, gives you wisdom for the decisions ahead, and makes you confident enough to become the woman you've been imagining.",
      "And yes, I hope 18 is really good to you.",
    ],
  },
  {
    id: 10,
    layout: "final",
    title: "Happy 18th, Praiz. ❤️",
    paragraphs: [
      "May this year bring you clarity, growth, good people, beautiful memories and a deeper walk with God.",
      "There's a lot ahead of you. Go and meet it.",
    ],
    footerText: "— Alexander",
    image: IMAGES.praiz1,
  },
];

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function BirthdayExperience() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [isOpeningEnvelope, setIsOpeningEnvelope] = useState<boolean>(false);
  const [isClickLocked, setIsClickLocked] = useState<boolean>(false);

  const totalSteps = SLIDES.length;
  const slide = SLIDES[currentStep];

  // Handle slide changing with debounce protection
  const goToNext = useCallback(() => {
    if (isClickLocked) return;
    if (currentStep < totalSteps - 1) {
      setIsClickLocked(true);
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
      setTimeout(() => setIsClickLocked(false), 500);
    }
  }, [currentStep, totalSteps, isClickLocked]);

  const goToPrev = useCallback(() => {
    if (isClickLocked) return;
    if (currentStep > 0) {
      setIsClickLocked(true);
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      setTimeout(() => setIsClickLocked(false), 500);
    }
  }, [currentStep, isClickLocked]);

  const restart = () => {
    setDirection(-1);
    setCurrentStep(0);
    setIsOpeningEnvelope(false);
  };

  // Envelope opener specific
  const handleEnvelopeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpeningEnvelope(true);
    setTimeout(() => {
      goToNext();
    }, 900);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (currentStep === 0 && !isOpeningEnvelope) {
          setIsOpeningEnvelope(true);
          setTimeout(() => goToNext(), 900);
        } else {
          goToNext();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, isOpeningEnvelope, goToNext, goToPrev]);

  // Framer motion variants
  const pageVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? "8%" : "-8%",
      scale: 0.99,
    }),
    animate: {
      opacity: 1,
      x: "0%",
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? "-8%" : "8%",
      scale: 0.99,
      transition: {
        duration: 0.4,
        ease: [0.7, 0, 0.84, 0],
      },
    }),
  };

  const itemVariants = {
    initial: { opacity: 0, y: 18 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div
      onClick={
        currentStep === 0 && !isOpeningEnvelope
          ? handleEnvelopeClick
          : currentStep === totalSteps - 1
          ? undefined
          : goToNext
      }
      className="relative w-screen h-screen overflow-hidden bg-[#faf7f5] text-[#2c2226] select-none font-sans cursor-pointer"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, rgba(216, 27, 96, 0.03) 0%, rgba(250, 247, 245, 0) 70%)",
      }}
    >
      {/* Soft Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Grain Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header Progress Indicator */}
      <header className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold tracking-widest text-[#d81b60] uppercase">
            Praiz Imonin
          </span>
          <span className="text-xs text-purple-300">•</span>
          <span className="text-xs text-purple-900/40 font-medium">18th Birthday</span>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono tracking-wider text-purple-950/60 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-100/80 shadow-sm">
          <span>{String(currentStep + 1).padStart(2, "0")}</span>
          <span className="text-purple-300">/</span>
          <span>{String(totalSteps).padStart(2, "0")}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full h-full flex items-center justify-center p-6 md:p-12 lg:p-16">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-5xl h-full max-h-[85vh] flex flex-col justify-center relative z-10"
          >
            {/* STEP 1: ENVELOPE / INTRO */}
            {slide.layout === "envelope" && (
              <div className="flex flex-col items-center justify-center text-center space-y-8 my-auto">
                <motion.div
                  variants={itemVariants}
                  className="relative group cursor-pointer"
                  onClick={handleEnvelopeClick}
                >
                  <div className="w-64 h-44 sm:w-80 sm:h-52 bg-gradient-to-br from-white to-fuchsia-50/50 rounded-2xl border border-fuchsia-200/80 shadow-xl shadow-fuchsia-900/5 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-fuchsia-300">
                    {/* Envelope Flap Simulation */}
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-fuchsia-100/40 border-b border-fuchsia-200/50 rounded-b-3xl transform -skew-y-1" />

                    <motion.div
                      animate={
                        isOpeningEnvelope
                          ? { scale: [1, 1.2, 0], rotate: [0, 10, -10] }
                          : { y: [0, -4, 0] }
                      }
                      transition={
                        isOpeningEnvelope
                          ? { duration: 0.8 }
                          : { repeat: Infinity, duration: 3, ease: "easeInOut" }
                      }
                      className="z-10 bg-gradient-to-tr from-[#d81b60] to-purple-600 p-4 rounded-full text-white shadow-md shadow-fuchsia-500/20"
                    >
                      <Mail className="w-8 h-8 sm:w-10 sm:h-10" />
                    </motion.div>

                    <p className="z-10 mt-4 text-xs font-medium tracking-wider uppercase text-purple-900/60">
                      {slide.accentText}
                    </p>
                  </div>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-3xl sm:text-5xl font-serif tracking-tight text-[#2c2226]"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-lg sm:text-xl font-light text-purple-950/80 max-w-md"
                >
                  {slide.subtitle}
                </motion.p>

                {slide.paragraphs?.map((p, idx) => (
                  <motion.p
                    key={idx}
                    variants={itemVariants}
                    className="text-sm sm:text-base text-purple-900/50 italic"
                  >
                    "{p}"
                  </motion.p>
                ))}
              </div>
            )}

            {/* SPLIT LAYOUT (IMAGES + TEXT) */}
            {slide.layout === "split" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto h-full">
                {/* Left side text or right depending on config */}
                <div
                  className={`space-y-6 lg:col-span-7 ${
                    slide.imagePosition === "left" ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  {slide.accentText && (
                    <motion.span
                      variants={itemVariants}
                      className="text-xs font-semibold tracking-widest text-[#d81b60] uppercase block"
                    >
                      {slide.accentText}
                    </motion.span>
                  )}

                  <motion.h2
                    variants={itemVariants}
                    className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c2226] leading-tight"
                  >
                    {slide.title}
                  </motion.h2>

                  {slide.paragraphs && (
                    <div className="space-y-4">
                      {slide.paragraphs.map((p, idx) => (
                        <motion.p
                          key={idx}
                          variants={itemVariants}
                          className="text-base sm:text-lg text-purple-950/80 font-light leading-relaxed"
                        >
                          {p}
                        </motion.p>
                      ))}
                    </div>
                  )}

                  {slide.listItems && (
                    <ul className="space-y-3 pt-2">
                      {slide.listItems.map((item, idx) => (
                        <motion.li
                          key={idx}
                          variants={itemVariants}
                          className="flex items-start space-x-3 text-base sm:text-lg text-purple-950/80 font-light"
                        >
                          <span className="text-[#d81b60] mt-1.5 text-xs">✦</span>
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Image side */}
                {slide.image && (
                  <motion.div
                    variants={itemVariants}
                    className={`lg:col-span-5 flex justify-center ${
                      slide.imagePosition === "left" ? "lg:order-1" : "lg:order-2"
                    }`}
                  >
                    <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10 border-4 border-white">
                      <motion.img
                        src={slide.image}
                        alt={slide.imageAlt || "Praiz Imonin"}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.6 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* CENTERED LAYOUT WITH BG IMAGE */}
            {slide.layout === "centered" && (
              <div className="relative flex flex-col items-center justify-center text-center max-w-3xl mx-auto my-auto p-6 sm:p-12 rounded-3xl overflow-hidden bg-white/40 backdrop-blur-sm border border-white/60 shadow-xl shadow-purple-900/5">
                {slide.accentText && (
                  <motion.span
                    variants={itemVariants}
                    className="text-xs font-semibold tracking-widest text-[#d81b60] uppercase mb-4 block"
                  >
                    {slide.accentText}
                  </motion.span>
                )}

                <motion.h2
                  variants={itemVariants}
                  className="text-3xl sm:text-5xl font-serif text-[#2c2226] mb-6 leading-tight"
                >
                  {slide.title}
                </motion.h2>

                <div className="space-y-4 max-w-xl">
                  {slide.paragraphs?.map((p, idx) => (
                    <motion.p
                      key={idx}
                      variants={itemVariants}
                      className={`text-base sm:text-lg leading-relaxed ${
                        idx === slide.paragraphs!.length - 1
                          ? "text-[#d81b60] font-medium pt-2"
                          : "text-purple-950/80 font-light"
                      }`}
                    >
                      {p}
                    </motion.p>
                  ))}
                </div>
              </div>
            )}

            {/* MINIMAL LAYOUT (PURE TYPOGRAPHY & LISTS) */}
            {slide.layout === "minimal" && (
              <div className="max-w-2xl mx-auto my-auto space-y-8">
                {slide.accentText && (
                  <motion.span
                    variants={itemVariants}
                    className="text-xs font-semibold tracking-widest text-[#d81b60] uppercase block"
                  >
                    {slide.accentText}
                  </motion.span>
                )}

                <motion.h2
                  variants={itemVariants}
                  className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c2226] leading-tight"
                >
                  {slide.title}
                </motion.h2>

                {slide.listItems && (
                  <div className="space-y-4 border-l-2 border-[#d81b60]/30 pl-6 my-6">
                    {slide.listItems.map((item, idx) => (
                      <motion.p
                        key={idx}
                        variants={itemVariants}
                        className="text-lg sm:text-xl font-serif italic text-purple-950/90"
                      >
                        "{item}"
                      </motion.p>
                    ))}
                  </div>
                )}

                {slide.paragraphs && (
                  <div className="space-y-4">
                    {slide.paragraphs.map((p, idx) => (
                      <motion.p
                        key={idx}
                        variants={itemVariants}
                        className="text-base sm:text-xl text-purple-950/80 font-light leading-relaxed"
                      >
                        {p}
                      </motion.p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FINAL STEP */}
            {slide.layout === "final" && (
              <div className="flex flex-col items-center justify-center text-center space-y-8 my-auto">
                <motion.div
                  variants={itemVariants}
                  className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#d81b60] via-purple-400 to-amber-200 shadow-xl"
                >
                  <img
                    src={slide.image}
                    alt="Praiz Imonin"
                    className="w-full h-full object-cover rounded-full border-2 border-white"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md text-[#d81b60]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </motion.div>

                <motion.h2
                  variants={itemVariants}
                  className="text-4xl sm:text-6xl font-serif text-[#2c2226]"
                >
                  {slide.title}
                </motion.h2>

                <div className="space-y-3 max-w-md">
                  {slide.paragraphs?.map((p, idx) => (
                    <motion.p
                      key={idx}
                      variants={itemVariants}
                      className="text-base sm:text-lg text-purple-950/80 font-light leading-relaxed"
                    >
                      {p}
                    </motion.p>
                  ))}
                </div>

                {slide.footerText && (
                  <motion.p
                    variants={itemVariants}
                    className="text-lg font-serif italic text-[#d81b60] pt-4"
                  >
                    {slide.footerText}
                  </motion.p>
                )}

                {/* Restart Button */}
                <motion.button
                  variants={itemVariants}
                  onClick={(e) => {
                    e.stopPropagation();
                    restart();
                  }}
                  className="mt-6 flex items-center space-x-2 bg-white/80 hover:bg-white text-purple-950 px-5 py-2.5 rounded-full border border-purple-200 shadow-sm text-xs font-medium tracking-wider uppercase transition-all hover:shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start from beginning</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Navigation Prompt */}
      {currentStep < totalSteps - 1 && (
        <footer className="absolute bottom-6 inset-x-0 z-30 flex justify-center items-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex items-center space-x-2 text-xs font-medium tracking-widest text-purple-900/40 uppercase bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50"
          >
            <span>Tap anywhere to continue</span>
            <ChevronRight className="w-3.5 h-3.5 animate-pulse text-[#d81b60]" />
          </motion.div>
        </footer>
      )}
    </div>
  );
}
