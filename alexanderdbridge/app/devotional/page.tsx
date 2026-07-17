"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IoArrowBack } from "react-icons/io5";
import { FaHeart, FaRegHeart, FaRegComment, FaCheck, FaBookmark, FaChevronRight } from "react-icons/fa6";
import { DEVOTIONALS_DATA, MONTH_THEME, Devotional } from "../devotionalData";

interface DevotionalViewProps {
  onClose: () => void;
}

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

// Framer Motion Animation Kinematics Configuration
const screenVariants: Variants = {
  hidden: { opacity: 0, scale: 0.99 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    scale: 1.01,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
  }
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const threadVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

export default function DevotionalView({ onClose }: DevotionalViewProps) {
  // 1. Dynamic Date Resolution Layer (Matches current context: 2026-07-17)
  const [currentDevotional, setCurrentDevotional] = useState<Devotional | null>(null);

  useEffect(() => {
    // Falls back gracefully to the final item in your list if index date is out of range
    const targetDate = "2026-07-15"; 
    const matched = DEVOTIONALS_DATA.find(d => d.dateString === targetDate);
    setCurrentDevotional(matched || DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1]);
  }, []);

  // Interaction & UI State
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(144);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      name: "Chidi Stackgate",
      text: "Moses knew God's ways while Israel saw His acts. This layer of depth is exactly what our generation needs to understand.",
      timestamp: "4m"
    },
    {
      id: "2",
      name: "Tobi Emmanuel",
      text: "The separation between willpower change and presence transformation. Clean word, Boss.",
      timestamp: "1h"
    }
  ]);
  
  const [commentText, setCommentText] = useState<string>(
    ""
  );
  const [userName, setUserName] = useState<string>("");
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);

  if (!currentDevotional) return null;

  const handleLikeToggle = (): void => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleCommentSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!userName.trim()) {
      setShowNamePrompt(true);
      return;
    }

    executePostComment();
  };

  const executePostComment = (): void => {
    const newComment: Comment = {
      id: Date.now().toString(),
      name: userName,
      text: commentText,
      timestamp: "Just now"
    };
    setComments([newComment, ...comments]);
    setCommentText("");
  };

  const handleSaveName = (): void => {
    if (userName.trim()) {
      setShowNamePrompt(false);
      executePostComment();
    }
  };

  return (
    <motion.div 
      variants={screenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[9999] bg-black text-white overflow-y-auto overflow-x-hidden antialiased selection:bg-neutral-800"
    >
      {/* 2. Gemini-Inspired Header Fade Overlay Layer */}
      <div className="fixed top-0 left-0 right-0 h-40 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-40" />

      {/* 3. Floating Separated Header Elements */}
      <header className="fixed top-6 left-0 right-0 max-w-2xl mx-auto px-6 flex items-center justify-between z-50">
        {/* Left: Floating Circle Back Action */}
        <div className="p-0.5 rounded-full bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 shadow-2xl">
          <button 
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Floating Circle Meta Badge */}
        <div className="px-5 py-2.5 rounded-full bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 shadow-2xl flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
          <span className="text-xs font-bold tracking-widest uppercase text-neutral-400">
            Day {currentDevotional.dayNumber}
          </span>
        </div>
      </header>

      {/* 4. Core Body Text Content Architecture */}
      <div className="w-full max-w-xl mx-auto px-6 pt-36 pb-44 relative z-10">
        <motion.article variants={contentVariants} initial="hidden" animate="visible" className="space-y-8">
          
          {/* Header Typography Group */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <span>Theme: {MONTH_THEME}</span>
              <span>•</span>
              <span>{currentDevotional.displayDate}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-100">
              {currentDevotional.topic}
            </h1>
            <p className="text-sm font-medium text-neutral-400 italic">
              Text Reference: {currentDevotional.text}
            </p>
          </div>

          {/* Memory Verse Frame */}
          <div className="p-5 rounded-2xl bg-neutral-900/30 border border-neutral-800/80 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-neutral-600" />
            <p className="text-base md:text-lg font-medium text-neutral-200 leading-relaxed mb-3">
              {currentDevotional.memoryVerse.verse}
            </p>
            <span className="text-xs font-bold tracking-wide uppercase text-neutral-500 block">
              — {currentDevotional.memoryVerse.reference}
            </span>
          </div>

          {/* Detailed Explanation Text */}
          <div className="text-base md:text-lg text-neutral-300 leading-relaxed font-light space-y-4">
            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-white">
              {currentDevotional.explanation}
            </p>
          </div>

          {/* Needed Steps Dynamic Mapping Layout */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-4 h-px bg-neutral-700" /> Needed Steps
            </h3>
            <ul className="space-y-3">
              {currentDevotional.neededSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm md:text-base text-neutral-300 items-start">
                  <span className="font-mono text-xs font-bold text-neutral-500 bg-neutral-900 border border-neutral-800 h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prayer Points Dynamic Mapping Layout */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-4 h-px bg-neutral-700" /> Prayer Points
            </h3>
            <div className="grid gap-3">
              {currentDevotional.prayerPoints.map((prayer, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-950 border border-neutral-900 flex gap-3 items-start">
                  <FaBookmark className="w-3 h-3 text-neutral-600 mt-1 flex-shrink-0" />
                  <p className="text-sm md:text-base font-medium text-neutral-300 leading-relaxed">
                    {prayer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.article>

        {/* Clean Line Separation Bridge */}
        <hr className="border-neutral-900 my-12" />

        {/* 5. Clean Connected Line Threading Comments System (X / Twitter Rules) */}
        <section className="space-y-8">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
            Discussion Matrix ({comments.length})
          </h3>

          <div className="space-y-0">
            <AnimatePresence initial={false}>
              {comments.map((comment, index) => (
                <motion.div 
                  key={comment.id}
                  variants={threadVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="flex gap-4 relative"
                >
                  {/* Clean Connected Line Thread Container */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-xs text-neutral-300">
                      {comment.name.charAt(0).toUpperCase()}
                    </div>
                    {index !== comments.length - 1 && (
                      <div className="w-0.5 flex-1 bg-neutral-900 my-2" />
                    )}
                  </div>

                  {/* Comment Info Flow Block */}
                  <div className="flex-1 pb-8 text-left">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-neutral-200">
                        {comment.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        · {comment.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed">
                      {comment.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* 6. Independent Floating UI Footer Control Layer */}
      <div className="fixed bottom-6 left-0 right-0 max-w-xl mx-auto px-6 z-50 pointer-events-none">
        <div className="w-full flex items-center gap-3 pointer-events-auto">
          
          <form onSubmit={handleCommentSubmit} className="w-full flex items-center gap-3">
            
            {/* Element Box 1: Like & Input Interface Tab */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-950/80 backdrop-blur-xl border border-neutral-800/80 shadow-2xl">
              
              {/* Like Action Block */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-neutral-800/80">
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  className={`p-2 rounded-xl transition-transform active:scale-75 ${liked ? "text-red-500" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {liked ? <FaHeart className="w-4 h-4" /> : <FaRegHeart className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono font-medium text-neutral-500 min-w-[12px]">
                  {likeCount}
                </span>
              </div>

              {/* Text Area Entry */}
              <input
                type="text"
                placeholder="Comment your question..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:ring-0"
              />
            </div>

            {/* Element Box 2: Independent Custom Post Button */}
            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="h-[50px] w-[50px] flex items-center justify-center rounded-2xl bg-white text-black font-semibold disabled:bg-neutral-900 disabled:text-neutral-600 active:scale-95 transition-all shadow-2xl border border-white/5"
                aria-label="Post comment"
              >
                <FaChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* 7. Name Request Overlay Modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-neutral-950 border border-neutral-900 shadow-2xl text-left"
            >
              <h4 className="text-base font-bold text-neutral-200 mb-1">
                Enter your name
              </h4>
              <p className="text-xs text-neutral-500 mb-4">
                What name should display with your comment or question?
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors"
                />
                
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowNamePrompt(false); setCommentText(""); }}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-500 hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={!userName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 transition-all"
                  >
                    <FaCheck className="w-3 h-3" /> Continue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
