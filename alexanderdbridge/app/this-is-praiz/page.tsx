"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants} from "framer-motion";
import {
  ChevronRight,
  RotateCcw,
  Heart,
  Mail,
Maximize2,
  Minimize2,
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
    paragraphs: [
      "And I don't know... your answers stayed with me.",
    ],
    accentText: "A little birthday note for Praiz",
  },

  {
    id: 2,
    layout: "split",
    title: "17 taught you a few things.",
    listItems: [
      "You can be angry without becoming cruel.",
      "You can be scared and still try.",
      "You need to take care of yourself too.",
      "And you're not late. You're just on your own timeline.",
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
      "This one stayed with me.",
      "Because it's easy to look around and feel like everybody is moving faster than you.",
      "But you're learning that somebody else's timing doesn't make yours wrong.",
      "So when 18 gets confusing, I hope you remember what you already know: you're not behind.",
    ],
    image: IMAGES.praiz2,
    imagePosition: "bg",
  },

  {
    id: 4,
    layout: "split",
    title: "You're learning yourself.",
    paragraphs: [
      "I actually liked this answer.",
      "Learning the difference between being alone and being lonely is something a lot of people don't figure out for a long time.",
      "I hope you get comfortable with your own company. Not because you don't need people, but because you know you don't have to run to people just because it's quiet.",
    ],
    image: IMAGES.praiz3,
    imageAlt: "Praiz reflective moment",
    imagePosition: "left",
  },

  {
    id: 5,
    layout: "minimal",
    title: "Then you told me who you want to become.",
    listItems: [
      "A daughter your parents can be proud of.",
      "A sister your siblings love and respect.",
      "A friend who makes people glad they met you.",
      "A mother your children can always talk to.",
      "A wife whose presence makes her partner thank God.",
    ],
    accentText: "The woman you're becoming",
  },

  {
    id: 6,
    layout: "split",
    title: "And then there's nursing.",
    paragraphs: [
      "I think there's something really special about wanting to care for people and also wanting to lead them to Christ.",
      "You want to know your work well, get your qualifications, understand people better through psychology, and eventually build something that cares for children who need a home.",
      "That's a lot of heart behind one dream.",
    ],
    image: IMAGES.praiz4,
    imageAlt: "Praiz dreaming big",
    imagePosition: "right",
  },

  {
    id: 7,
    layout: "centered",
    title: "And you're grateful.",
    accentText: "HEALTH & PEOPLE",
    paragraphs: [
      "You mentioned good health first, and I understood why when you talked about UBTH.",
      "Sometimes seeing other people go through difficult things makes you realise how much you've been carrying without even calling it a blessing.",
      "And then there's your people. The ones who have taught you, challenged you, loved you, and even the ones who taught you through the hard moments.",
      "I hope you never become too busy to notice those gifts.",
    ],
    image: IMAGES.praiz5,
    imagePosition: "bg",
  },

  {
    id: 8,
    layout: "split",
    title: "So... 18.",
    paragraphs: [
      "You don't have to have everything figured out now.",
      "Maybe 18 is just another year of learning yourself a little better.",
      "Learning how to handle money. How to speak when something is wrong. How to apologise. How to choose people. How to take care of yourself.",
      "And somewhere in all of that, I pray God gives you clarity.",
      "Clarity for the things you can see, and wisdom for the things you can't see yet.",
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
      "Praiz, I really hope 18 is kind to you.",
      "I hope you laugh a lot, meet good people, make mistakes you learn from, and have moments you'll look back on and smile about.",
      "I pray God keeps you, guides you, and gives you the wisdom to know what to hold on to and what to let go.",
      "And when you don't know what you're doing, I hope you remember that you don't have to figure everything out in one day.",
    ],
  },

  {
    id: 10,
    layout: "final",
    title: "Happy 18th, Praiz. ❤️",
    paragraphs: [
      "I'm genuinely glad I got to know you.",
      "May God give you clarity, protect your heart, keep you healthy, and lead you into the woman you're becoming.",
      "There's a lot ahead of you.",
      "Take it one step at a time.",
    ],
    footerText: "— Alexander D Bridge",
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
const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

// Toggle Fullscreen state
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering slide change

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        });
      }
    }
  };

  // Sync state if user exits full screen using ESC key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);


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
  // Framer motion variants with proper TypeScript tuple typing
// Framer motion variants explicitly typed
const pageVariants: Variants = {
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

const itemVariants: Variants = {
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
          "radial-gradient(circle at 50% 50%, rgba(136, 14, 79, 0.03) 0%, rgba(250, 247, 245, 0) 70%)",
      }}
    >
      {/* Soft Background Accent Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Grain Texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header Progress Indicator & Fullscreen Button */}
      <header className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold tracking-widest text-[#880e4f] uppercase">
            Praiz Imonin
          </span>
          <span className="text-xs text-purple-300">•</span>
          <span className="text-xs text-purple-900/40 font-medium">18th Birthday</span>
        </div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          {/* Step counter */}
          <div className="flex items-center space-x-2 text-xs font-mono tracking-wider text-purple-950/70 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-purple-100/80 shadow-sm">
            <span>{String(currentStep + 1).padStart(2, "0")}</span>
            <span className="text-purple-300">/</span>
            <span>{String(totalSteps).padStart(2, "0")}</span>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2 rounded-full bg-white/60 backdrop-blur-md border border-purple-100/80 shadow-sm text-purple-950/70 hover:text-[#880e4f] hover:bg-white transition-all active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
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
                      className="z-10 bg-gradient-to-tr from-[#880e4f] to-purple-600 p-4 rounded-full text-white shadow-md shadow-fuchsia-500/20"
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
                      className="text-xs font-semibold tracking-widest text-[#880e4f] uppercase block"
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
                          <span className="text-[#880e4f] mt-1.5 text-xs">✦</span>
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
                    className="text-xs font-semibold tracking-widest text-[#880e4f] uppercase mb-4 block"
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
                          ? "text-[#880e4f] font-medium pt-2"
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
                    className="text-xs font-semibold tracking-widest text-[#880e4f] uppercase block"
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
                  <div className="space-y-4 border-l-2 border-[#880e4f]/30 pl-6 my-6">
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
                  className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-[#880e4f] via-purple-400 to-amber-200 shadow-xl"
                >
                  <img
                    src={slide.image}
                    alt="Praiz Imonin"
                    className="w-full h-full object-cover rounded-full border-2 border-white"
                  />
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
                    className="text-lg font-serif italic text-[#880e4f] pt-4"
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
            <ChevronRight className="w-3.5 h-3.5 animate-pulse text-[#880e4f]" />
          </motion.div>
        </footer>
      )}
    </div>
  );

}
