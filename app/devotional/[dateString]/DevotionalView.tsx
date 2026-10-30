/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { IoCheckmark } from "react-icons/io5";
import { FaHeart, FaRegHeart, FaRegCommentDots } from "react-icons/fa6";
import {
  DEVOTIONALS_DATA,
  MONTH_THEME,
  Devotional,
} from "../../data/devotionalData";
import { useParams, useRouter } from "next/navigation";
import { getSessionId, getStoredUserName, storeUserName } from "@/lib/session";
import { formatRelativeTime } from "@/lib/utils/date";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

import { Comment } from "@/app/components/CommentItem";
import { CommentSlideUpModal } from "@/app/components/CommentSlideUpModal";
import YesterdayPromptCallout from "@/app/components/YesterdayPromptCallout";
import StreakFooterBanner from "@/app/components/StreakFooterBanner";
import MonthlyCelebration from "./MonthlyCelebration";
import StreakFloatingButton from "@/app/components/StreakFloatingButton";
import { BiShare } from "react-icons/bi";
import StreakCelebrationModal from "@/app/components/StreakCelebrationModal";
import StreakDrawer from "@/app/components/StreakDrawer";
import { useStreakTracker } from "@/app/hooks/useStreakTracker";
import BackgroundMusic from "./BackgroundMusic";
import Header from "@/app/components/Header";
import AuthModal from "@/alexanderdbridge/app/auth/Authmodal";
import DevotionalArticle from "@/app/components/DevotionalArticle";
import ReminderTimePicker from "@/app/components/ReminderTimePicker";
import Survey from "@/app/components/Survey";
import { AuthorMessageModal } from "@/app/components/AuthorMessageModal";
import { PwaInstallButton } from "@/app/components/PwaInstallBtn";
import BibleStudyCard from "./BibleStudyCard";
import Preloader from "@/app/components/ui/Preloader";
import VerificationCelebrationModal from "@/app/components/VerificationCelebrationModal";

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

export default function DevotionalView({ devotional }: { devotional: any }) {
  const params = useParams();
  const router = useRouter();

  const urlDateString = params?.dateString as string | undefined;
  const [isFloatingVisible, setIsFloatingVisible] = useState<boolean>(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>("");

  // Streak state & hooks
  const [isStreakDrawerOpen, setIsStreakDrawerOpen] = useState(false);
  const {
    streakData,
    newlyUnlockedMedal,
    clearNewMedalAlert,
    dwellSeconds,
    minDwellSeconds,
    todayCompleted,
    markTodayComplete,
  } = useStreakTracker(user?.id);

  // Helper function to reset the auto-hide timer
  const startHideTimer = (delayMs: number) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsFloatingVisible(false);
    }, delayMs);
  };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setIsAuthLoading(false);
      if (sessionUser?.user_metadata?.full_name && !userName) {
        setUserName(sessionUser.user_metadata.full_name);
        storeUserName(sessionUser.user_metadata.full_name);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (session?.user?.user_metadata?.full_name && !userName) {
        setUserName(session.user.user_metadata.full_name);
        storeUserName(session.user.user_metadata.full_name);
      }
    });

    return () => subscription.unsubscribe();
  }, [userName]);

  // 1. Initial load 10s auto-hide timer
  useEffect(() => {
    startHideTimer(10000);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // 2. Scroll listener to show column and trigger 4s hide delay when scrolling stops
  useEffect(() => {
    const handleScroll = () => {
      setIsFloatingVisible(true);
      startHideTimer(4000);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Starts empty so the loader shows until the API responds (no flash of hardcoded content)
  const [devotionalsList, setDevotionalsList] = useState<Devotional[]>([]);
  const [currentDevotional, setCurrentDevotional] = useState<Devotional | null>(
    null,
  );
  const [todayDateString, setTodayDateString] = useState<string>("");
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [viewsCount, setViewsCount] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState<string>("");

  // Modal & Reply states
  const [isCommentModalOpen, setIsCommentModalOpen] = useState<boolean>(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState<string | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    string | null
  >(null);
  const [isSubmittingComment, setIsSubmittingComment] =
    useState<boolean>(false);
  const [isReminderPickerOpen, setIsReminderPickerOpen] =
    useState<boolean>(false);

  // Preloader & Interaction states
  const [introStage, setIntroStage] = useState<IntroStage>("logo");
  const [copied, setCopied] = useState<boolean>(false);

  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Deep Link handler for ?comment=... and ?reply=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const commentParam = urlParams.get("comment");
    const replyParam = urlParams.get("reply");

    if (commentParam) {
      setIsCommentModalOpen(true);
      setHighlightedCommentId(commentParam);
      if (replyParam) {
        setReplyingToId(commentParam);
      }
      const timer = setTimeout(() => {
        setHighlightedCommentId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Welcome Email Trigger on user authentication (idempotent, sent once via Resend)
  useEffect(() => {
    if (!user) return;
    async function triggerWelcomeEmail() {
      try {
        const supabase = createSupabaseBrowserClient();
        const session = (await supabase?.auth.getSession())?.data?.session;
        if (!session?.access_token) return;

        await fetch("/api/email/welcome", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      } catch (err) {
        console.error("Welcome email check failed:", err);
      }
    }
    triggerWelcomeEmail();
  }, [user]);

  // Prompt reminder time picker once after intro finishes if user hasn't configured it yet
  useEffect(() => {
    if (introStage !== "done" || !user) return;
    if (typeof window === "undefined") return;

    const configured = localStorage.getItem(
      "bridge_devotional_reminder_configured",
    );
    if (!configured) {
      const timer = setTimeout(() => {
        setIsReminderPickerOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [introStage, user]);

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
            return;
          }
        }
      } catch (err) {
        console.error("Error loading devotionals:", err);
      }
      // Offline fallback only: use bundled data if the API failed or returned nothing
      setDevotionalsList(DEVOTIONALS_DATA);
    }
    fetchDevotionals();
  }, []);

  // 2. Live Client-Side Date Calculation & Data Association Layer
  useEffect(() => {
    const today = new Date();
    const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setTodayDateString(formattedToday);

    if (devotionalsList.length === 0) return;

    const targetDate = urlDateString || formattedToday;
    const matched = devotionalsList.find((d) => d.dateString === targetDate);
    const activeEntry = matched || devotionalsList[devotionalsList.length - 1];

    if (
      activeEntry &&
      (!currentDevotional ||
        currentDevotional.dateString !== activeEntry.dateString)
    ) {
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
        const res = await fetch(
          `/api/devotionals/${date}/stats?sessionId=${sessionId}&_t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );
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
        const res = await fetch(
          `/api/devotionals/${date}/comments?sessionId=${sessionId}&_t=${Date.now()}`,
          {
            cache: "no-store",
          },
        );
        if (res.ok) {
          const data = await res.json();
          const mappedComments = (data.comments || []).map((c: any) => ({
            id: c.id,
            name: c.author_name,
            text: c.body,
            timestamp: formatRelativeTime(c.created_at),
            likes: c.like_count ?? 0,
            liked: Boolean(c.liked),
            authorUserId: c.author_user_id || undefined,
            avatarUrl: c.author_avatar || undefined,
            authorVerificationTier: c.author_verification_tier ?? null,
            streakCount: c.author_streak || 0,
            replies: (c.replies || []).map((r: any) => ({
              id: r.id,
              name: r.author_name,
              text: r.body,
              timestamp: formatRelativeTime(r.created_at),
              authorUserId: r.author_user_id || undefined,
              avatarUrl: r.author_avatar || undefined,
              authorVerificationTier: r.author_verification_tier ?? null,
              streakCount: r.author_streak || 0,
            })),
          }));
          setComments(mappedComments);
        }
      } catch (err) {
        console.error("Error loading comments:", err);
      }
    }

    recordView().then(async () => {
      fetchStats();
      if (user) {
        const supabase = createSupabaseBrowserClient();
        const session = (await supabase?.auth.getSession())?.data?.session;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token)
          headers["Authorization"] = `Bearer ${session.access_token}`;

        fetch(`/api/devotionals/${date}/visitors`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: user.id,
            displayName:
              user.user_metadata?.full_name || user.user_metadata?.name || "",
            avatarUrl:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              "",
          }),
        }).catch(() => {});
      }
    });
    fetchComments();
  }, [currentDevotional, user]);

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

  const handleLikeToggle = async (): Promise<void> => {
    if (!currentDevotional) return;

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

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
  useEffect(() => {
    if (introStage === "done") {
      setIsCelebrationOpen(true);
    }
  }, [introStage]);

  const handleShare = async () => {
    if (!currentDevotional) return;

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

  const handleCommentSubmit = (
    e: React.FormEvent,
    mentionedUserIds: string[] = [],
  ): void => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    executePostComment(userName.trim(), mentionedUserIds);
  };

  const executePostComment = async (
    name: string,
    mentionedUserIds: string[] = [],
  ): Promise<void> => {
    if (!currentDevotional) return;
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const date = currentDevotional.dateString;
    setIsSubmittingComment(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      let verificationTier: string | null = null;

      try {
        const verificationRes = await fetch("/api/users/verification", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
          cache: "no-store",
        });

        if (verificationRes.ok) {
          const verificationData = await verificationRes.json();
          verificationTier = verificationData.verification_tier ?? null;
        }
      } catch (error) {
        console.error("Failed to fetch verification tier:", error);
      }
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      if (replyingToId) {
        // Format reply text with recipient handle if not already prefixed
        const formattedReplyText =
          replyingToName &&
          !commentText
            .trim()
            .toLowerCase()
            .startsWith(`@${replyingToName.toLowerCase()}`)
            ? `@${replyingToName} ${commentText.trim()}`
            : commentText.trim();

        // Post Reply
        const res = await fetch(`/api/comments/${replyingToId}/replies`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name,
            text: formattedReplyText,
            avatarUrl:
              user?.user_metadata?.avatar_url ||
              user?.user_metadata?.picture ||
              undefined,
            authorUserId: user?.id || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const newReply = {
            id: data.reply.id,
            name: data.reply.author_name,
            text: data.reply.body,
            timestamp: "Just now",
            avatarUrl:
              user?.user_metadata?.avatar_url ||
              user?.user_metadata?.picture ||
              undefined,
            authorUserId: user?.id || undefined,
            authorVerificationTier:
              data.reply.author_verification_tier ?? verificationTier,
            streakCount:
              data.reply.author_streak ?? streakData?.currentStreak ?? 0,
          };

          setComments((prev) =>
            prev.map((c) => {
              if (c.id === replyingToId) {
                return {
                  ...c,
                  replies: [...(c.replies || []), newReply],
                };
              }
              return c;
            }),
          );

          setCommentText("");
          setReplyingToId(null);
          setReplyingToName(null);
        } else {
          const data = await res.json();
          alert(data.error || "Failed to post reply");
        }
      } else {
        // Post Top-level Comment
        const res = await fetch(`/api/devotionals/${date}/comments`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name,
            text: commentText,
            avatarUrl:
              user?.user_metadata?.avatar_url ||
              user?.user_metadata?.picture ||
              undefined,
            authorUserId: user?.id || undefined,
            mentionedUserIds,
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
            avatarUrl:
              user?.user_metadata?.avatar_url ||
              user?.user_metadata?.picture ||
              undefined,
            authorUserId: user?.id || undefined,
            authorVerificationTier:
              data.comment.author_verification_tier ?? verificationTier,
            streakCount:
              data.comment.author_streak ?? streakData?.currentStreak ?? 0,
          };

          setComments((prev) => [newComment, ...prev]);
          setComments([newComment, ...comments]);
          setCommentText("");
        } else {
          const data = await res.json();
          alert(data.error || "Failed to post comment");
        }
      }
    } catch (err) {
      console.error("Error posting comment/reply:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

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
      }),
    );

    try {
      const supabase = createSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          actorUserId: user?.id || undefined,
          actorName: user?.user_metadata?.full_name || userName || undefined,
          actorAvatar:
            user?.user_metadata?.avatar_url ||
            user?.user_metadata?.picture ||
            undefined,
        }),
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
          }),
        );
      }
    } catch (err) {
      console.error("Error toggling comment like:", err);
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

  // Compute yesterday's date string (YYYY-MM-DD)
  const yesterdayDateString = (() => {
    if (!currentDevotional?.dateString) return "";
    const parts = currentDevotional.dateString.split("-");
    if (parts.length !== 3) return "";
    const [year, month, day] = parts.map(Number);
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() - 1);
    return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
  })();

  // Find yesterday's devotional topic dynamically from devotionalsList
  const yesterdayDevotional = devotionalsList.find(
    (d) => d.dateString === yesterdayDateString,
  );
  const yesterdayTopic = yesterdayDevotional?.topic || "Yesterday's Devotional";

  // Check if yesterday's devotional is already read (from local storage or user history)
  const isYesterdayRead = (() => {
    if (!yesterdayDateString || !streakData?.attendanceHistory) return false;
    const record = streakData.attendanceHistory[yesterdayDateString];
    return Boolean(record && record.completed);
  })();

  const [, setIsAuthModalOpen] = useState(false);
  const requiresAuthPrompt = !isAuthLoading && !user;

  if (!currentDevotional) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-neutral-300">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Preloader />{" "}
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-neutral-500">
            Loading Devotional...
          </p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      variants={screenVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-black text-white selection:bg-neutral-800 relative min-h-screen"
    >
      <MonthlyCelebration />
      <YesterdayPromptCallout
        currentDateString={currentDevotional.dateString}
        yesterdayTopic={yesterdayTopic}
        isYesterdayRead={isYesterdayRead}
      />
      {/* Floating Right Side Action Column */}
      <motion.div
        initial={{ x: 0, opacity: 1 }}
        animate={{
          x: isFloatingVisible ? 0 : 100,
          opacity: isFloatingVisible ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-40 bottom-26 right-6 lg:right-[30vw] flex flex-col justify-between gap-4 pointer-events-auto"
      >
        <div className="flex flex-col items-center gap-1 z-40 relative">
          <div onClick={() => setIsStreakDrawerOpen(true)}>
            <StreakFloatingButton />
          </div>

          {/* Like Button & Counter */}
          <button
            type="button"
            onClick={handleLikeToggle}
            className={`flex p-1 transition-transform active:scale-75 ${
              liked ? "text-[#ff0000]" : "text-neutral-300 hover:text-white"
            }`}
          >
            {liked ? (
              <FaHeart className="size-6" />
            ) : (
              <FaRegHeart className="size-5" />
            )}
          </button>
          <span className="font-mono font-medium text-neutral-300 min-w-3 text-xs text-center">
            {likeCount}
          </span>
        </div>

        {/* Floating Comment Button & Counter */}
        <div className="flex flex-col items-center gap-1 z-40 relative">
          <button
            type="button"
            onClick={() => setIsCommentModalOpen(true)}
            className="p-1 rounded-full text-neutral-300 hover:text-white active:scale-75 transition-all flex items-center justify-center"
            aria-label="Open Comments"
          >
            <FaRegCommentDots className="size-6" />
          </button>
          <span className="font-mono font-medium text-neutral-300 min-w-3 text-xs text-center">
            {comments.reduce(
              (total, c) => total + 1 + (c.replies?.length || 0),
              0,
            )}{" "}
          </span>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="p-3 rounded-full text-neutral-300 hover:text-white active:scale-75 transition-all border border-white/10 backdrop-blur-xl hover:bg-neutral-800/80 flex items-center justify-center relative z-40"
          aria-label="Share Devotional"
        >
          {copied ? (
            <IoCheckmark className="size-6 text-green-500" />
          ) : (
            <BiShare className="size-6" />
          )}
        </button>

        <BackgroundMusic />

        <PwaInstallButton />

        <div className="absolute top-0 bottom-0 right-0 w-16 bg-linear-to-l from-black/90 via-black/80 to-transparent pointer-events-none z-0" />
      </motion.div>

      {/* Intro Preloader Overlay */}
      <AnimatePresence>
        {introStage !== "done" && (
          <motion.div
            key="preloader-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-9999 bg-black flex flex-col items-center justify-center px-6 h-screen"
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
                    Current Progress Day {currentDevotional.dayNumber}
                  </span>
                  <h3 className="text-4xl font-semibold tracking-tight">
                    {currentDevotional.displayDate}
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

      {/* Sign-in prompt for protected actions */}
      <AuthModal
        isOpen={requiresAuthPrompt}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <div className="fixed top-0 left-0 right-0 h-20 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none z-40" />

      <Header />
      <div className="w-full max-w-xl mx-auto px-6 pt-24 pb-28 relative z-10">
        <div className="w-full mx-auto relative z-10">
          <div className="w-full mb-4 relative z-50">
            <div
              ref={scrollContainerRef}
              className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 snap-x scroll-smooth"
            >
              {devotionalsList.map((item) => {
                const isSelected =
                  item.dateString === currentDevotional.dateString;
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

        {/* Reusable Component Insertion */}
        <DevotionalArticle
          devotional={currentDevotional}
          monthTheme={MONTH_THEME}
          viewsCount={viewsCount}
          contentVariants={contentVariants}
        />
        {/* 365 Bible Study Movement Integration */}
        <BibleStudyCard dateString={devotional?.dateString} />
      </div>

      {/* Streak Side-Drawer */}
      <StreakDrawer
        isOpen={isStreakDrawerOpen}
        onClose={() => setIsStreakDrawerOpen(false)}
        streakData={streakData}
        userName={userName || "Believer"}
      />

      {/* Streak Celebration Popup Modal */}
      <StreakCelebrationModal
        medal={newlyUnlockedMedal}
        onClose={clearNewMedalAlert}
        userName={userName || "Believer"}
      />

      {/* Daily Devotional Reminder Alarm Picker Modal */}
      <ReminderTimePicker
        isOpen={isReminderPickerOpen}
        onClose={() => setIsReminderPickerOpen(false)}
        userId={user?.id}
      />

      {/* Slide-Up Comment Modal Component */}
      <CommentSlideUpModal
        isOpen={isCommentModalOpen}
        onClose={() => {
          setIsCommentModalOpen(false);
          setReplyingToId(null);
          setReplyingToName(null);
        }}
        comments={comments}
        commentText={commentText}
        setCommentText={setCommentText}
        onSubmitComment={handleCommentSubmit}
        onLikeComment={handleCommentLike}
        replyingToId={replyingToId}
        replyingToName={replyingToName}
        setReplyingTo={(id, name) => {
          setReplyingToId(id);
          setReplyingToName(name);
        }}
        isSubmitting={isSubmittingComment}
        userInitial={userName ? userName.charAt(0).toUpperCase() : "U"}
        userAvatarUrl={user?.user_metadata?.avatar_url}
        highlightedCommentId={highlightedCommentId}
      />

      <StreakFooterBanner
        currentStreak={streakData?.currentStreak || 0}
        dwellSeconds={dwellSeconds}
        minDwellSeconds={minDwellSeconds}
        isAlreadyCompleted={todayCompleted}
        onMarkAsRead={markTodayComplete}
      />
      <AuthorMessageModal
        messageId="v1.2_october_invite"
        delayMs={2000}
        title="Keep Growing With Us ❤️"
        paragraphs={[
          "Hey, I'm glad you're part of Bridge Daily. ❤️ Keep showing up, keep studying God's Word, and keep growing in your walk with Him. Every day counts, even the small ones.",
          "Also, think of one person who could benefit from this journey and invite them to join us. Let's help more people stay consistent with God, one person at a time. We're building this together!",
        ]}
      />
      {/* Dynamic Survey Conditional Render (Shows only if completed count >= 5) */}
      {(() => {
        const history = streakData?.attendanceHistory || {};
        const completedCount = Object.values(history).filter(
          (record: any) => record?.completed === true,
        ).length;

        return completedCount >= 5 ? <Survey /> : null;
      })()}

      <VerificationCelebrationModal
        isOpen={introStage === "done" && isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
      />
    </motion.div>
  );
}
