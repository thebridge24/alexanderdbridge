/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IoArrowBack, IoEyeOutline, IoShareOutline, IoCheckmark } from "react-icons/io5";
import {
  FaHeart,
  FaRegHeart,
  FaCheck,
  FaReply,
} from "react-icons/fa6";
import { DEVOTIONALS_DATA, MONTH_THEME, Devotional } from "../../devotionalData"; 
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSessionId, getStoredUserName, storeUserName } from "@/lib/session";
import { formatRelativeTime } from "@/lib/utils/date";
import { FaPaperPlane } from "react-icons/fa";

interface Reply {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  replies?: Reply[];
}

type IntroStage = "logo" | "day" | "theme" | "done";

// Framer Motion Animation Kinematics Configuration
const screenVariants: Variants = {
  hidden: { opacity: 0, scale: 0.99 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const threadVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
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

export default function DevotionalView() {
  const params = useParams();
  const router = useRouter();

  const urlDateString = params?.dateString as string | undefined;

  const [devotionalsList, setDevotionalsList] = useState<Devotional[]>(DEVOTIONALS_DATA);
  const [currentDevotional, setCurrentDevotional] = useState<Devotional | null>(null);
  const [todayDateString, setTodayDateString] = useState<string>("");
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);

  // Preloader & Interaction states
  const [introStage, setIntroStage] = useState<IntroStage>("logo");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Preloader Stage Controls
  useEffect(() => {
    const timer1 = setTimeout(() => setIntroStage("day"), 1800);
    const timer2 = setTimeout(() => setIntroStage("theme"), 4000);
    const timer3 = setTimeout(() => setIntroStage("done"), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // 1. Fetch dynamic devotionals from API on mount
  useEffect(() => {
    async function fetchDevotionals() {
      try {
        const res = await fetch("/api/devotionals");
        if (res.ok) {
          const data = await res.json();
          if (data.devotionals && data.devotionals.length > 0) {
            setDevotionalsList(data.devotionals);
          }
        }
      } catch (err) {
        console.error("Error loading devotionals:", err);
      }
    }
    fetchDevotionals();
  }, []);

  // 2. Live Client-Side Date Calculation & Data Association Layer
  useEffect(() => {
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setTodayDateString(formattedToday);

    const targetDate = urlDateString || formattedToday;
    const matched = devotionalsList.find((d) => d.dateString === targetDate);
    const activeEntry = matched || devotionalsList[devotionalsList.length - 1];

    if (activeEntry && (!currentDevotional || currentDevotional.dateString !== activeEntry.dateString)) {
      setCurrentDevotional(activeEntry);
    }
  }, [devotionalsList, urlDateString]);

  // 3. Load stats, views, and comments when active devotional changes
  useEffect(() => {
    if (!currentDevotional) return;

    const date = currentDevotional.dateString;
    const sessionId = getSessionId();

    const storedName = getStoredUserName();
    if (storedName) {
      setUserName(storedName);
    }

    async function recordView() {
      try {
        const res = await fetch(`/api/devotionals/${date}/view`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          setViewsCount(data.viewCount);
        }
      } catch (err) {
        console.error("Error recording view:", err);
      }
    }

    async function fetchStats() {
      try {
        const res = await fetch(`/api/devotionals/${date}/stats?sessionId=${sessionId}&_t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setLikeCount(data.likeCount);
          setLiked(data.liked);
          if (data.viewCount !== undefined) {
            setViewsCount(data.viewCount);
          }
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    }

    async function fetchComments() {
      try {
        const res = await fetch(`/api/devotionals/${date}/comments?sessionId=${sessionId}&_t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const mappedComments = (data.comments || []).map((c: any) => ({
            id: c.id,
            name: c.author_name,
            text: c.body,
            timestamp: formatRelativeTime(c.created_at),
            likes: c.like_count ?? 0,
            liked: Boolean(c.liked),
            replies: (c.replies || []).map((r: any) => ({
              id: r.id,
              name: r.author_name,
              text: r.body,
              timestamp: formatRelativeTime(r.created_at),
            })),
          }));
          setComments(mappedComments);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    }

    recordView().then(() => {
      fetchStats();
    });
    fetchComments();
  }, [currentDevotional]);

  useEffect(() => {
    if (currentDevotional && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(
        `[data-date="${currentDevotional.dateString}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [currentDevotional]);

  if (!currentDevotional) return null;

  const handleLikeToggle = async (): Promise<void> => {
    if (!currentDevotional) return;
    const date = currentDevotional.dateString;
    const sessionId = getSessionId();

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/devotionals/${date}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLikeCount(data.likeCount);
        setLiked(data.liked);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setLiked(liked);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentDevotional.topic} | Daily Devotional`,
      text: `Read today's devotional: "${currentDevotional.topic}"`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!userName.trim()) {
      setShowNamePrompt(true);
      return;
    }

    executePostComment(userName.trim());
  };

  const executePostComment = async (name: string): Promise<void> => {
    if (!currentDevotional) return;
    const date = currentDevotional.dateString;

    try {
      const res = await fetch(`/api/devotionals/${date}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          text: commentText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newComment: Comment = {
          id: data.comment.id,
          name: data.comment.author_name,
          text: data.comment.body,
          timestamp: "Just now",
          likes: 0,
          liked: false,
          replies: [],
        };
        setComments([newComment, ...comments]);
        setCommentText("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    const sessionId = getSessionId();

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = c.liked;
          return {
            ...c,
            liked: !isLiked,
            likes: isLiked ? Math.max(c.likes - 1, 0) : c.likes + 1,
          };
        }
        return c;
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                likes: data.likeCount,
                liked: data.liked,
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error("Error toggling comment like:", err);
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!replyText.trim()) return;
    const author = userName.trim() || "Believer";
    const text = replyText.trim();

    try {
      const res = await fetch(`/api/comments/${commentId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: author,
          text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newReply: Reply = {
          id: data.reply.id,
          name: data.reply.author_name,
          text: data.reply.body,
          timestamp: "Just now",
        };

        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                replies: [...(c.replies || []), newReply],
              };
            }
            return c;
          })
        );

        setReplyText("");
        setReplyingToId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to post reply");
      }
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  const handleSaveName = (): void => {
    const trimmedName = userName.trim();
    if (trimmedName) {
      storeUserName(trimmedName);
      setShowNamePrompt(false);
      executePostComment(trimmedName);
    }
  };

  const isFutureDate = (dateStr: string) => {
    if (!todayDateString) return false;
    return dateStr > todayDateString;
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getDayNumber = (dateStr: string) => {
    return dateStr.split("-")[2];
  };

  return (
    <motion.div
      variants={screenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-black text-white selection:bg-neutral-800 relative min-h-screen"
    >
      {/* Intro Preloader Overlay */}
      <AnimatePresence>
        {introStage !== "done" && (
          <motion.div
            key="preloader-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-200 bg-black flex flex-col items-center justify-center px-6 h-screen"
          >
            <AnimatePresence mode="wait">
              {introStage === "logo" && (
                <motion.h2
                  key="intro-logo"
                  variants={cinematicVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-2xl font-light tracking-[0.25em] uppercase text-neutral-200"
                >
                 Daily Devotional
                </motion.h2>
              )}

              {introStage === "day" && (
                <motion.div
                  key="intro-day"
                  variants={cinematicVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center"
                >
                  <span className="text-[11px] tracking-widest text-neutral-500 uppercase block mb-1 font-medium">
                    Current Progress
                  </span>
                  <h3 className="text-4xl font-semibold tracking-tight">
                    Day {currentDevotional.dayNumber}
                  </h3>
                </motion.div>
              )}

              {introStage === "theme" && (
                <motion.div
                  key="intro-theme"
                  variants={cinematicVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center max-w-md"
                >
                  <span className="text-[11px] tracking-widest text-neutral-500 uppercase block mb-2 font-medium">
                    Theme: {MONTH_THEME}
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
                    {currentDevotional.topic}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 right-0 h-20 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none z-40" />

      <header className="fixed top-4 left-0 right-0 max-w-2xl mx-auto px-6 flex items-center justify-between z-50">
        <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl">
          <Link
            href="/"
            className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <IoArrowBack className="w-5 h-5" />
          </Link>
        </div>

        <div className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/60 shadow-2xl flex gap-0.5 items-end">
          <span className="text-2xl font-bold capitalize text-white">
            Daily Devotional
          </span>
          <span className="bg-[#ff0000] size-1.5 sm:size-2 rounded-full mb-1.5 sm:mb-2"></span>
        </div>
      </header>

      <div className="w-full max-w-xl mx-auto px-6 pt-24 pb-44 relative z-10">
        <div className="w-full mx-auto relative z-10">
          <div className="w-full mb-4 relative z-50">
            <div
              ref={scrollContainerRef}
              className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 snap-x scroll-smooth"
            >
              {devotionalsList.map((item) => {
                const isSelected = item.dateString === currentDevotional.dateString;
                const isFuture = isFutureDate(item.dateString);

                return (
                  <button
                    key={item.dateString}
                    data-date={item.dateString}
                    disabled={isFuture}
                    onClick={() => {
                      router.push(`/devotional/${item.dateString}`);
                      setTimeout(() => {
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                        });
                      }, 500);
                    }}
                    className={`flex flex-col cursor-pointer items-center shrink-0 w-14 snap-center rounded-2xl border transition-all duration-300 group
                    ${isFuture ? "opacity-20 border-transparent pointer-events-none" : ""}
                    ${
                      isSelected
                        ? "bg-[#ff0000] border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] scale-105"
                        : "bg-neutral-900/60 border-neutral-800/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                    }
                  `}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider pt-2.5 pb-1 block transition-colors
                    ${isSelected ? "text-white" : "text-neutral-500 group-hover:text-neutral-400"}
                  `}
                    >
                      {getDayLabel(item.dateString)}
                    </span>

                    <div
                      className={`w-full text-center bg-black/30 rounded-t-xl font-bold text-base pb-3 pt-0.5
                    ${isSelected ? "text-white" : "text-neutral-200"}
                  `}
                    >
                      {getDayNumber(item.dateString)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <motion.article
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
              <span>Day {currentDevotional.dayNumber}</span>
              <span>•</span>
              <span>Theme: {MONTH_THEME}</span>
              <span>•</span>
              <span>{currentDevotional.displayDate}</span>
              {viewsCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <IoEyeOutline className="size-3.5" /> {viewsCount} {viewsCount === 1 ? "view" : "views"}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-100">
              {currentDevotional.topic}
            </h1>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-neutral-800/80 relative overflow-hidden text-center px-8">
            <p className="text-base md:text-lg font-medium text-neutral-200 leading-relaxed mb-3">
              {currentDevotional.memoryVerse.verse}
            </p>
            <span className="text-xs font-bold tracking-wide uppercase text-neutral-500 block">
              — {currentDevotional.memoryVerse.reference}
            </span>
          </div>

          <div className="text-base md:text-lg text-neutral-300 leading-relaxed font-light space-y-4">
            <p className="first-letter:text-4xl first-letter:font-bold first-letter:text-white">
              {currentDevotional.explanation}
            </p>
          </div>

          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
              <span className="w-4 h-px bg-neutral-700" /> Needed Steps
            </h3>
            <ul className="grid gap-3">
              {currentDevotional.neededSteps.map((step, idx) => (
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
              {currentDevotional.prayerPoints.map((prayer, idx) => (
                <div key={idx} className=" flex gap-3 items-start">
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

        <hr className="border-neutral-900 my-12" />

        <section className="space-y-8">
          <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
            Discussion/Question Section ({comments.length})
          </h3>

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {comments.length === 0 ? (
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
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    variants={threadVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="flex gap-4 relative"
                  >
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-black text-xs text-neutral-300">
                        {comment.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="w-0.5 flex-1 bg-neutral-900 my-2" />
                    </div>

                    <div className="flex-1 pb-4 text-left">
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

                      {/* X-Style Interaction Row for Comment */}
                      <div className="flex items-center gap-6 mt-3">
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className={`flex items-center gap-1.5 text-xs transition-colors ${
                            comment.liked
                              ? "text-red-500"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          {comment.liked ? (
                            <FaHeart className="w-3.5 h-3.5" />
                          ) : (
                            <FaRegHeart className="w-3.5 h-3.5" />
                          )}
                          <span>{comment.likes}</span>
                        </button>

                        <button
                          onClick={() =>
                            setReplyingToId(
                              replyingToId === comment.id ? null : comment.id
                            )
                          }
                          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          <FaReply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* Inline Reply Input */}
                      {replyingToId === comment.id && (
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-neutral-900/80 border border-neutral-800 rounded-full px-4 py-1.5 text-xs text-neutral-200 outline-none focus:border-neutral-700"
                          />
                          <button
                            onClick={() => handleReplySubmit(comment.id)}
                            className="px-3 py-1.5 bg-white text-black text-xs font-semibold rounded-full hover:bg-neutral-200 transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      )}

                      {/* Nested Replies Rendering */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l border-neutral-800">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="text-left">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-neutral-300">
                                  {reply.name}
                                </span>
                                <span className="text-[10px] text-neutral-500">
                                  · {reply.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-1">
                                {reply.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Floating Bottom Toolbar */}
      <div className="fixed bottom-6 left-0 right-0 max-w-xl mx-auto px-6 z-50 pointer-events-none">
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-40" />

        <div className="w-full flex items-center gap-3 pointer-events-auto relative z-50">
          <form
            onSubmit={handleCommentSubmit}
            className="w-full flex items-center gap-3"
          >
            <div className="flex items-center p-2.5 border border-white/10 bg-white/5 backdrop-blur-2xl rounded-full gap-1">
              <button
                type="button"
                onClick={handleLikeToggle}
                className={`p-1 rounded-full transition-transform active:scale-75 ${liked ? "text-[#ff0000]" : "text-neutral-300 hover:text-white"}`}
              >
                {liked ? (
                  <FaHeart className="size-5" />
                ) : (
                  <FaRegHeart className="size-5" />
                )}
              </button>
              <span className="text-xs font-mono font-medium text-neutral-300 min-w-3 pr-1">
                {likeCount}
              </span>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full text-neutral-300 hover:text-white active:scale-75 transition-all border-l border-white/10 pl-2.5"
                aria-label="Share Devotional"
              >
                {copied ? (
                  <IoCheckmark className="size-5 text-green-500" />
                ) : (
                  <IoShareOutline className="size-5" />
                )}
              </button>
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <input
                type="text"
                placeholder="Share your insight..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent border-none outline-none py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:ring-0"
              /><div className="shrink-0">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="h-10 w-10 flex items-center justify-center rounded-full font-semibold  disabled:text-neutral-600 backdrop-blur-xl active:scale-95 transition-all shadow-2xl text-white"
                aria-label="Post comment"
              >
                <FaPaperPlane className="w-4 h-4 stroke-2" />
              </button>
            </div>
            </div>

            
          </form>
        </div>
      </div>

      {/* Name Prompt Modal */}
      <AnimatePresence>
        {showNamePrompt && (
          <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-sm p-6 rounded-4xl bg-neutral-950 border border-neutral-900 shadow-2xl text-left"
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
                    onClick={() => {
                      setShowNamePrompt(false);
                      setCommentText("");
                    }}
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