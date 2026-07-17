"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IoArrowBack } from "react-icons/io5";
import { FaHeart, FaRegHeart, FaRegComment, FaCheck, FaBookmark, FaChevronRight } from "react-icons/fa6";
import { DEVOTIONALS_DATA, MONTH_THEME, Devotional } from "../devotionalData";

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

export default function DevotionalView() {
  const [currentDevotional, setCurrentDevotional] = useState<Devotional | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);

  // 1. Live Client-Side Date Calculation & Data Association Layer
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Generates precise system signature string: "YYYY-MM-DD"
    const formattedToday = `${year}-${month}-${day}`;
    
    // Query local source matrix for match
    const matched = DEVOTIONALS_DATA.find(d => d.dateString === formattedToday);
    
    // Graceful fallback to the latest available entry if current date exceeds data map
    const activeEntry = matched || DEVOTIONALS_DATA[DEVOTIONALS_DATA.length - 1];
    
    setCurrentDevotional(activeEntry);
    
    // Seed standard base metrics contextually
    if (activeEntry) {
      setLikeCount(Math.floor(Math.random() * 40) + 12); 
    }
  }, []);

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
      className="bg-black text-white  selection:bg-neutral-800"
    >
      {/* Gemini-Inspired Header Fade Overlay Layer */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-40" />

      {/* Floating Fully Rounded Header Structure */}
      <header className="fixed top-4 left-0 right-0 max-w-2xl mx-auto px-6 flex items-center justify-between z-50">
        {/* Left: Action Back Circle */}
        <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl">
          <a 
            href="/"
            className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <IoArrowBack className="w-5 h-5" />
          </a>
        </div>

        {/* Right: Floating Pill Meta Badge */}
        <div className="px-5 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/60 shadow-2xl flex items-center gap-2">
         
          <span className=" font-bold capitalize text-white">
           Daily Devotional
          </span>
        </div>
      </header>

      {/* Core Typography & Meta Architecture */}
      <div className="w-full max-w-xl mx-auto px-6 pt-24 pb-44 relative z-10">
        <motion.article variants={contentVariants} initial="hidden" animate="visible" className="space-y-8">
          
          {/* Header Data Context */}
          <div className="space-y-2">
            <div className="gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
<p>
Day {currentDevotional.dayNumber}
</p>
              <span>Theme: {MONTH_THEME}</span>
              <span>•</span>
              <span>{currentDevotional.displayDate}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-100">
              {currentDevotional.topic}
            </h1>
          </div>

          {/* Memory Verse Frame - Rounded Full Pill Architecture */}
          <div className="p-6 rounded-2xl bg-white/5 border border-neutral-800/80 relative overflow-hidden text-center px-8">
            <p className="text-base md:text-lg font-medium text-neutral-200 leading-relaxed mb-3">
            {currentDevotional.memoryVerse.verse}
            </p>
            <span className="text-xs font-bold tracking-wide uppercase text-neutral-500 block">
              — {currentDevotional.memoryVerse.reference}
            </span>
          </div>

          {/* Detailed Content Narrative */}
          <div className="text-base md:text-lg text-neutral-300 leading-relaxed font-light space-y-4">
            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-white">
              {currentDevotional.explanation}
            </p>
          </div>

          {/* Needed Steps Mapping */}
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-4 h-px bg-neutral-700" /> Needed Steps
            </h3>
            <ul className="">
              {currentDevotional.neededSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-sm md:text-base text-neutral-300 items-start">
                  <span className="font-mono text-xs font-bold text-neutral-400 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed flex-1">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prayer Points Mapping */}
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-4 h-px bg-neutral-700" /> Prayer Points
            </h3>
            <div className="grid gap-3">
              {currentDevotional.prayerPoints.map((prayer, idx) => (
                <div key={idx} className=" flex gap-3 items-start">
                  <span className="font-mono text-xs font-bold text-neutral-400 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">
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

        <hr className="border-neutral-900 my-12" />

        {/* Clean Line Threading Discussion System */}
        <section className="space-y-8">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
            Discussion/Question Section ({comments.length})
          </h3>

          <div className="space-y-0">
            <AnimatePresence initial={false}>
              {comments.length === 0 ? (
                // Realism Layer: Empty State Handling when no user input exists
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="px-6 py-12 text-center rounded-2xl bg-white/5 border border-neutral-900 border-dashed"
                >
                  <p className="text-sm text-neutral-500 font-medium">
                    No questions or observations posted yet. Be the first to start the thread.
                  </p>
                </motion.div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div 
                    key={comment.id}
                    variants={threadVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex gap-4 relative"
                  >
                    {/* Vertical Connecting Guide */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-xs text-neutral-300">
                        {comment.name.charAt(0).toUpperCase()}
                      </div>
                      {index !== comments.length - 1 && (
                        <div className="w-0.5 flex-1 bg-neutral-900 my-2" />
                      )}
                    </div>

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
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Floating UI Footer Command Layer */}
      <div className="fixed bottom-6 left-0 right-0 max-w-xl mx-auto px-4 z-50 pointer-events-none">

 <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-40" />



        <div className="w-full flex items-center gap-3 pointer-events-auto relative z-50">
          <form onSubmit={handleCommentSubmit} className="w-full flex items-center gap-3">
            
            {/* Input & Like Component Container - Fully Rounded Pill */}
            <div className="flex-1 flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/80 shadow-2xl">
              
                <div className="flex items-center pr-3 border-r border-white/30">
                <button
                  type="button"
                  onClick={handleLikeToggle}
                  className={`p-2 rounded-full transition-transform active:scale-75 ${liked ? "text-red-500" : "text-neutral-300 hover:text-neutral-300"}`}
                >
                  {liked ? <FaHeart className="size-5" /> : <FaRegHeart className="size-5" />}
                </button>
                <span className="text-xs font-mono font-medium text-neutral-300 min-w-[12px]">
                  {likeCount}
                </span>
              </div>

              <input
                type="text"
                placeholder="Share your insight..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:ring-0"
              />
            </div>

            {/* Action Submit Button - Fully Rounded Circle */}
            <div className="flex-shrink-0">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="h-[52px] w-[52px] flex items-center justify-center rounded-full bg-white text-black font-semibold disabled:bg-neutral-900 disabled:text-neutral-400 active:scale-95 transition-all shadow-2xl border border-white/5"
                aria-label="Post comment"
              >
                <FaChevronRight className="w-4 h-4 stroke-[2]" />
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Interactive Verification Modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-[2rem] bg-neutral-950 border border-neutral-900 shadow-2xl text-left"
            >
              <h4 className="text-base font-bold text-neutral-200 mb-1">
                Identity Profile
              </h4>
              <p className="text-xs text-neutral-500 mb-4">
                What name would you like to anchor to your post?
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  autoFocus
                  className="w-full px-5 py-3 rounded-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-neutral-700 transition-colors"
                />
                
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowNamePrompt(false); setCommentText(""); }}
                    className="px-4 py-2.5 rounded-full text-xs font-semibold text-neutral-500 hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={!userName.trim()}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-white text-black disabled:bg-neutral-800 disabled:text-neutral-600 transition-all"
                  >
                    <FaCheck className="w-3 h-3" /> Save Changes
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
