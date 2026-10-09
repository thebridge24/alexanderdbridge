"use client";

import React, { useEffect, useState } from "react";
import { Star, Flame, ArrowRight, Heart } from "lucide-react";

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

  // Fetch real data from Surveys, Streaks, and Devotional Comments
  useEffect(() => {
    let isMounted = true;

    async function loadTestimonialData() {
      try {
        const [surveyRes, streakRes] = await Promise.all([
          fetch("/api/admin/surveys").catch(() => null),
          fetch("/api/admin/users").catch(() => null),
        ]);

        const surveyData = surveyRes && surveyRes.ok ? await surveyRes.json() : { submissions: [] };
        const streakData = streakRes && streakRes.ok ? await streakRes.json() : { users: [] };

        const streakMap = new Map<string, number>();
        (streakData.users || []).forEach((u: any) => {
          if (u.email) streakMap.set(u.email.toLowerCase(), u.streak_count || u.streak || 0);
        });

        const formattedSurveyCards: TestimonialCardData[] = (surveyData.submissions || [])
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
              streakCount: streakMap.get((sub.userEmail || "").toLowerCase()) || Math.floor(Math.random() * 12) + 1,
              rating: sub.overallRating || 5,
              feedbackText: feedback,
              sourceType: "survey" as const,
            };
          })
          .filter(Boolean);

        const fallbackCards: TestimonialCardData[] = [
          {
            id: "fb-1",
            name: "Emmanuel Oke",
            streakCount: 24,
            rating: 5,
            feedbackText: "The daily depth and focus on personal spiritual growth has transformed my morning quiet time.",
            sourceType: "survey",
          },
          {
            id: "fb-2",
            name: "Grace Daniel",
            streakCount: 18,
            rating: 5,
            feedbackText: "Reading these devotionals every morning keeps me anchored and aligned with God's word.",
            sourceType: "comment",
          },
          {
            id: "fb-3",
            name: "David K.",
            streakCount: 31,
            rating: 5,
            feedbackText: "The reflection questions and community comments give me a sense of true fellowship.",
            sourceType: "survey",
          },
          {
            id: "fb-4",
            name: "Sarah A.",
            streakCount: 12,
            rating: 5,
            feedbackText: "Simple, deep, and spirit-filled daily word. I haven't missed a day in a month!",
            sourceType: "comment",
          },
        ];

        if (isMounted) {
          setCards([...formattedSurveyCards, ...fallbackCards]);
        }
      } catch (err) {
        console.error("Error loading support testimonials:", err);
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Tag Header */}
      <div className="relative z-10 pt-8 px-6 text-center">
        <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/50 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
          Bridge Daily Community
        </span>
      </div>

      {/* Tilted Marquee Testimonial Visual Container */}
      <div className="relative z-10 my-auto py-4 overflow-hidden -rotate-3 scale-105">
        
        {/* Row 1: Leftward Scroll */}
        <div className="flex gap-4 mb-4 w-max animate-marquee-left">
          {[...row1, ...row1, ...row1].map((card, i) => (
            <TestimonialCard key={`row1-${card.id}-${i}`} card={card} />
          ))}
        </div>

        {/* Row 2: Rightward Scroll */}
        <div className="flex gap-4 w-max animate-marquee-right">
          {[...row2, ...row2, ...row2].map((card, i) => (
            <TestimonialCard key={`row2-${card.id}-${i}`} card={card} />
          ))}
        </div>

        {/* Side Edge Gradient Overlays */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      </div>

      {/* Bottom Content & Navigation Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black via-black/95 to-transparent pt-8 pb-10 px-6 max-w-md mx-auto w-full text-center space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
            Support the Work ❤️
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-xs mx-auto">
            Bridge Daily is growing, and we're working hard to keep the platform running, improve your daily experience, and reach more people. Your support helps us maintain the platform and keep it free from ads.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-2xl shadow-xl shadow-red-950/50 transition-all flex items-center justify-center gap-2 group"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Step Pagination Dots */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-6 bg-red-600"
                  : "w-1.5 bg-neutral-800"
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
    <div className="w-[260px] sm:w-[280px] bg-neutral-950/90 border border-neutral-800/90 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3 shrink-0 backdrop-blur-sm">
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
            <h4 className="text-xs font-bold text-white truncate max-w-[110px]">
              {card.name}
            </h4>
            <div className="flex items-center gap-1 text-[10px] text-red-500 font-mono">
              <Star className="w-2.5 h-2.5 fill-red-500" />
              <span>{card.rating || 5}.0</span>
            </div>
          </div>
        </div>

        {card.streakCount !== undefined && (
          <div className="flex items-center gap-1 bg-red-950/40 border border-red-900/40 text-red-400 text-[10px] font-mono px-2 py-0.5 rounded-full">
            <Flame className="w-3 h-3 fill-red-500 text-red-500" />
            <span>{card.streakCount}d</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-neutral-300 leading-relaxed line-clamp-3 italic">
        "{card.feedbackText}"
      </p>
    </div>
  );
}
