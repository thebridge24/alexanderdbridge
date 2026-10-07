"use client";

import { motion, Variants } from "framer-motion";
import DailyVisitors from "@/app/components/DailyVisitors";
import { Devotional } from "../data/devotionalData";

interface DevotionalArticleProps {
  devotional: Devotional;
  monthTheme: string;
  viewsCount: number;
  contentVariants?: Variants;
}

const defaultContentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function DevotionalArticle({
  devotional,
  monthTheme,
  contentVariants = defaultContentVariants,
}: DevotionalArticleProps) {

  return (
    <>
      <motion.article
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
            <span>Day {devotional.dayNumber}</span>
            <span>•</span>
            <span>{devotional.displayDate}</span>
            <span>•</span>
            <span>Monthly Theme: {monthTheme}</span>
          </div>
          <DailyVisitors devotionalDate={devotional.dateString} />
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-100">
            {devotional.topic}
          </h1>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-neutral-800/80 relative overflow-hidden text-center px-8">
          <p className="text-base md:text-lg font-medium text-neutral-200 leading-relaxed mb-3">
            {devotional.memoryVerse.verse}
          </p>
          <span className="text-xs font-bold tracking-wide uppercase text-neutral-500 block">
            — {devotional.memoryVerse.reference}
          </span>
        </div>

        <div className="text-base md:text-lg text-neutral-300 leading-relaxed font-light space-y-4">
          <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-white ">
            {devotional.explanation}
          </p>
        </div>

        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
            <span className="w-4 h-px bg-neutral-700" /> Needed Steps
          </h3>
          <ul className="grid gap-3">
            {devotional.neededSteps.map((step, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-sm md:text-base text-neutral-300 items-start"
              >
                <span className="font-mono text-xs font-bold text-neutral-400 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
            <span className="w-4 h-px bg-neutral-700" /> Prayer Points
          </h3>
          <div className="grid gap-3">
            {devotional.prayerPoints.map((prayer, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="font-mono text-xs font-bold text-neutral-400 h-6 w-6 rounded-full flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm md:text-base font-medium text-neutral-300 leading-relaxed flex-1">
                  {prayer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.article>
    </>
  );
}