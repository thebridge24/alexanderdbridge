/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Flame, ChevronLeft, ChevronRight, Loader2, Heart } from "lucide-react";
import VerifiedBadge from "@/app/components/VerifiedBadge";

export interface FeedbackCardData {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  verificationTier?: string | null;
  streakCount: number;
  rank: number;
  rating: number;
  feedbackText: string;
  roleOrBio?: string;
}

export default function FeedbackPage() {
  const [cards, setCards] = useState<FeedbackCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Fetch real survey submissions & user streak/rank data
  useEffect(() => {
    let isMounted = true;

    async function loadFeedbackData() {
      try {
        setIsLoading(true);

        const [surveyRes, usersRes] = await Promise.all([
          fetch("/api/admin/surveys").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
        ]);

        const surveyData = surveyRes && surveyRes.ok ? await surveyRes.json() : { submissions: [] };
        const usersData = usersRes && usersRes.ok ? await usersRes.json() : { users: [] };

        const rawUsers: any[] = usersData.users || [];
        
        // Sort users by highest streak for accurate rank assignment
        const sortedUsers = [...rawUsers].sort((a, b) => {
          const streakA = a.currentStreak || a.streak_count || a.streak || 0;
          const streakB = b.currentStreak || b.streak_count || b.streak || 0;
          return streakB - streakA;
        });

        const userMap = new Map<string, { streak: number; rank: number; tier?: string; avatar?: string }>();
        
        sortedUsers.forEach((u, idx) => {
          if (u.email) {
            const emailKey = u.email.toLowerCase().trim();
            userMap.set(emailKey, {
              streak: u.currentStreak || u.streak_count || u.streak || 0,
              rank: idx + 1,
              tier: u.verification_tier || u.verificationTier || null,
              avatar: u.avatar_url || u.avatarUrl,
            });
          }
        });

        const mappedCards: FeedbackCardData[] = (surveyData.submissions || [])
          .map((sub: any) => {
            const feedback =
              sub.answers?.helped_walk_with_god ||
              sub.answers?.like_most ||
              sub.answers?.excites_most ||
              sub.answers?.feedback ||
              "";

            if (!feedback || feedback.trim().length < 5) return null;

            const userEmail = (sub.userEmail || "").toLowerCase().trim();
            const matchedUser = userMap.get(userEmail);

            return {
              id: sub.id || Math.random().toString(),
              userId: sub.userId,
              name: sub.userName || "Devotional Reader",
              email: userEmail,
              avatarUrl: sub.userAvatar || matchedUser?.avatar,
              verificationTier: matchedUser?.tier,
              streakCount: matchedUser?.streak || 0,
              rank: matchedUser?.rank || 99,
              rating: sub.overallRating || 5,
              feedbackText: feedback,
              roleOrBio: sub.answers?.role || "",
            };
          })
          .filter((card: FeedbackCardData | null): card is FeedbackCardData => Boolean(card));

        if (isMounted) {
          setCards(mappedCards);
        }
      } catch (err) {
        console.error("Failed to load feedback page data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeedbackData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Infinite sliding carousel navigation controls
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-red-600 selection:text-white">


      {/* Top Header Section */}
      <header className="relative z-10 pt-12 pb-6 px-6 text-center max-w-3xl mx-auto space-y-3">
        <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
          <span>Community Feedback</span>
        </div>

        {/* Main Bolder Question Text */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Has the devotional helped you in your personal walk with God?
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Feedbacks from believers growing daily in the word.
        </p>
      </header>

      {/* Center Carousel Container */}
      <main className="relative z-10 my-auto py-6 px-4 w-full max-w-6xl mx-auto overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              Loading Testimonies...
            </span>
          </div>
        ) : cards.length > 0 ? (
          <div className="flex flex-col items-center space-y-8">
            {/* Sliding Track Viewport */}
            <div className="relative w-full overflow-hidden px-2 py-4">
              <motion.div
                className="flex gap-6 items-stretch"
                animate={{
                  x: `calc(-${currentIndex * (100 / (typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : 1))}% - ${currentIndex * 24}px)`,
                }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
              >
                {cards.map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className="w-full md:w-[calc(33.333%-16px)] shrink-0 flex"
                  >
                    {/* Uniform Height Card */}
                    <div className="w-full bg-neutral-950/90 border border-neutral-800/90 rounded-3xl p-6 shadow-xl flex flex-col justify-between backdrop-blur-md">
                      {/* Card Header */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {card.avatarUrl ? (
                              <img
                                src={card.avatarUrl}
                                alt={card.name}
                                className="w-10 h-10 rounded-full object-cover border border-neutral-800 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sm font-bold text-neutral-300 shrink-0">
                                {card.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-sm font-bold text-white truncate max-w-32.5 sm:max-w-40">
                                  {card.name}
                                </h3>
                                <VerifiedBadge tier={card.verificationTier} name={card.name} size="xs" />
                              </div>
                              <p className="text-[11px] text-neutral-500 truncate">
                                {card.roleOrBio}  Rank {" "} <span className="font-bold">#{card.rank}</span>
                              </p>
                            </div>
                          </div>

                          {/* Streak Badge */}
                          {card.streakCount > 0 && (
                            <div className="flex items-center gap-1 bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-mono font-bold px-2.5 py-1 rounded-full shrink-0">
                              <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                              <span>{card.streakCount}d</span>
                            </div>
                          )}
                        </div>

                        {/* Rating & Rank */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <div className="flex items-center gap-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-3.5 h-3.5 ${
                                  starIdx < card.rating
                                    ? "fill-amber-500 text-amber-500"
                                    : "fill-neutral-800 text-neutral-800"
                                }`}
                              />
                            ))}
                            <span className="text-xs font-mono font-bold text-white ml-1">
                              {card.rating}.0
                            </span>
                          </div>

                          <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                            Rank <span className="text-white font-bold">#{card.rank}</span>
                          </div>
                        </div>

                        {/* Feedback Text */}
                        <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed italic pt-2">
                          &quot;{card.feedbackText}&quot;
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 mt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                        <span>Bridge Daily Community</span>
                        <Heart className="w-3 h-3 text-red-600 fill-red-600/30" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Carousel Controls & Slotted Pagination Dots */}
            <div className="flex flex-col items-center space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  aria-label="Previous Review"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Sliding Pagination Dots (Capped window for clean UI) */}
                <div className="flex items-center gap-1.5 px-2">
                  {cards.slice(0, Math.min(cards.length, 7)).map((_, idx) => {
                    // Map active indicator across sliding window if total cards exceed 7
                    const activeIndicatorIdx = currentIndex % Math.min(cards.length, 7);
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          idx === activeIndicatorIdx ? "w-6 bg-red-600" : "w-2 bg-neutral-800 hover:bg-neutral-700"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  aria-label="Next Review"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-neutral-500 text-xs font-mono bg-neutral-950/50 rounded-3xl border border-neutral-900 max-w-md mx-auto">
            No feedback entries available yet.
          </div>
        )}
      </main>

      {/* Bottom Footer Section with Required Link */}
      <footer className="relative z-20 py-8 px-6 text-center border-t border-neutral-900/80 bg-black">
        <Link
          href="/devotional"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors group"
        >
          <span>Bridge Daily Devotional</span>
          <span className="text-red-500 group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </footer>
    </div>
  );
}