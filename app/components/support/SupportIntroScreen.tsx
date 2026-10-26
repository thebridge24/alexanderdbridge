/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { Star, Flame, Heart, Loader2 } from "lucide-react";

export interface TestimonialCardData {
  id: string;
  name: string;
  avatarUrl?: string;
  streakCount?: number;
  rating?: number;
  feedbackText: string;
  sourceType: "survey" | "comment";
}

interface SupportIntroScreenProps {
  /** Action handler when user clicks "Continue" */
  onNext: () => void;
  /** Active step index for bottom pagination dots (e.g. 0 for Step 1) */
  currentStep?: number;
  /** Total onboarding steps (default: 4) */
  totalSteps?: number;
}

export const SupportIntroScreen: React.FC<SupportIntroScreenProps> = ({
  onNext,
  currentStep = 0,
  totalSteps = 4,
}) => {
  const [cards, setCards] = useState<TestimonialCardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch real data from Surveys and Streaks
  useEffect(() => {
    let isMounted = true;

    async function loadTestimonialData() {
      try {
        setIsLoading(true);
        const [surveyRes, streakRes] = await Promise.all([
          fetch("/api/admin/surveys").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
        ]);

        const surveyData =
          surveyRes && surveyRes.ok
            ? await surveyRes.json()
            : { submissions: [] };
        const streakData =
          streakRes && streakRes.ok ? await streakRes.json() : { users: [] };

        const streakMap = new Map<string, number>();
        (streakData.users || []).forEach((u: any) => {
          if (u.email)
            streakMap.set(
              u.email.toLowerCase(),
              u.streak_count || u.streak || 0
            );
        });

        const realSurveyCards: TestimonialCardData[] = (
          surveyData.submissions || []
        )
          .map((sub: any) => {
            const feedback =
              sub.answers?.helped_walk_with_god ||
              sub.answers?.like_most ||
              sub.answers?.excites_most ||
              "";

            if (!feedback || feedback.trim().length < 5) return null;

            return {
              id: sub.id,
              name: sub.userName || "Devotional Reader",
              avatarUrl: sub.userAvatar,
              streakCount:
                streakMap.get((sub.userEmail || "").toLowerCase()) || 0,
              rating: sub.overallRating || 5,
              feedbackText: feedback,
              sourceType: "survey" as const,
            };
          })
          .filter((card: TestimonialCardData | null): card is TestimonialCardData => Boolean(card));

        if (isMounted) {
          setCards(realSurveyCards);
        }
      } catch (err) {
        console.error("Error loading support testimonials:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTestimonialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const row1 = cards.slice(0, Math.ceil(cards.length / 2));
  const row2 = cards.slice(Math.ceil(cards.length / 2));

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col justify-between overflow-hidden">
      {/* Background Red Ambient Glow Gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-87.5 h-87.5 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Tag Header */}
      <div className="relative z-10 pt-8 px-6 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-primary bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
          <Heart className="w-3 h-3 fill-primary text-primary" />
          Bridge Daily Community
        </span>
      </div>

      {/* Tilted Marquee Testimonial Visual Container or Loader */}
      <div className="relative z-10 my-auto py-8 overflow-hidden min-h-55 flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-12">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">
              Loading Community...
            </span>
          </div>
        ) : cards.length > 0 ? (
          <div className="-rotate-3 scale-105 w-full">
            {/* Row 1: Leftward Scroll */}
            <div className="flex gap-4 mb-4 w-max animate-marquee-left">
              {[...row1, ...row1, ...row1].map((card, i) => (
                <TestimonialCard key={`row1-${card.id}-${i}`} card={card} />
              ))}
            </div>

            {/* Row 2: Rightward Scroll */}
            {row2.length > 0 && (
              <div className="flex gap-4 w-max animate-marquee-right">
                {[...row2, ...row2, ...row2].map((card, i) => (
                  <TestimonialCard key={`row2-${card.id}-${i}`} card={card} />
                ))}
              </div>
            )}

            {/* Side Edge Gradient Overlays */}
            <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-black to-transparent z-10 pointer-events-none" />
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 text-xs font-mono">
            No community reviews loaded yet.
          </div>
        )}
      </div>

      {/* Bottom Content & Navigation Controls */}
      <div className="relative z-20 bg-linear-to-t from-black via-black/95 to-transparent pt-8 pb-10 px-6 max-w-md mx-auto w-full text-center space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Support the Work ❤️
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
            Bridge Daily is growing, and we&apos;re working hard to keep the platform
            running, improve your daily experience, and reach more people. Your
            support helps us maintain the platform and keep it free from ads.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 bg-red-600 hover:bg-primary active:scale-[0.98] text-white font-medium text-sm rounded-full shadow-xl shadow-red-950/50 transition-all flex items-center justify-center group"
        >
          <span>Continue</span>
        </button>

        {/* Step Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? "w-6 bg-red-600" : "w-1.5 bg-neutral-800"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* Testimonial Card Component */
function TestimonialCard({ card }: { card: TestimonialCardData }) {
  return (
    <div className="w-65 sm:w-70 bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 shrink-0 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {card.avatarUrl ? (
            <img
              src={card.avatarUrl}
              alt={card.name}
              className="w-8 h-8 rounded-full object-cover border border-neutral-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
              {card.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-white truncate max-w-27.5">
              {card.name}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-primary font-mono">
              <Star className="w-2.5 h-2.5 fill-primary" />
              <span>{card.rating || 5}.0</span>
            </div>
          </div>
        </div>

        {card.streakCount ? (
          <div className="flex items-center gap-1 bg-red-950/40 border border-red-900/40 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 fill-primary text-primary" />
            <span>{card.streakCount}d</span>
          </div>
        ) : null}
      </div>

      <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-3 italic">
        &quot;{card.feedbackText}&quot;
      </p>
    </div>
  );
}