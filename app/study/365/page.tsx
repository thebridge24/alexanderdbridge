/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getReadingForDate, getDayOfYear } from "../../services/biblePlan";
import { isDayCompleted, markDayCompleted } from "../../services/studyStorage";
import { Check } from "lucide-react";
import { IoArrowBack } from "react-icons/io5";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/alexanderdbridge/app/auth/AuthButton";

export default function StudyPage() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const targetDate = dateParam ? new Date(dateParam) : new Date();
  const reading = getReadingForDate(targetDate);
  const dayOfYear = getDayOfYear(targetDate);

  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [user, setUser] = useState<any>(null);

  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  // Fetch Supabase User session & Passage on mount
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return; // Guard against null client

    async function fetchUserData() {
      // Use optional chaining or non-null assertion since we checked above
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (user) {
        setUser(user);
      }
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    setHasScrolledToBottom(false);
    setCompleted(isDayCompleted(dayOfYear));

    async function fetchPassage() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/bible?ref=${encodeURIComponent(reading.reference)}`,
        );
        if (!res.ok) throw new Error("Could not fetch reading text.");
        const data = await res.json();
        setContent(data.htmlContent);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPassage();
  }, [dayOfYear, reading.reference]);

  useEffect(() => {
    if (!bottomSentinelRef.current || loading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasScrolledToBottom(true);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [loading, error]);

  const handleMarkAsRead = () => {
    markDayCompleted(dayOfYear, reading.reference);
    setCompleted(true);
  };

  const backLink = dateParam ? `/devotional/${dateParam}` : "/";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-4 sm:px-6 py-8 md:py-16 selection:bg-red-600 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <header className="space-y-4 border-b border-neutral-800 pb-6">
          <div className="fixed top-0 left-0 right-0 h-20 bg-linear-to-b from-black via-black/80 to-transparent pointer-events-none z-40" />

          {/* Top Bar with Back Button, Title & Avatar */}
          <div className="pointer-events-auto flex items-center justify-between fixed top-4 left-4 right-4 z-50">
            <div className="flex items-center gap-3">
              <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl">
                <Link
                  href={backLink}
                  className="size-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
                  aria-label="Go back"
                >
                  <IoArrowBack className="size-5" />
                </Link>
              </div>
              <span className="text-xl font-bold">Devotional</span>
            </div>

            {/* Reader's Avatar on Top Right */}
            <div className="size-12 rounded-full overflow-hidden bg-neutral-800 border-4 border-red-700 shadow-lg">
              {user ? (
                <UserAvatar
                  avatarUrl={avatarUrl}
                  userId={user.id}
                  className="size-full"
                />
              ) : (
                <div className="size-full bg-neutral-900 animate-pulse" />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-12">
            <span className="text-base font-bold text-red-500 uppercase tracking-widest">
              Day {dayOfYear} of 365
            </span>
            <span className="text-xs text-neutral-400 px-3 py-1 rounded-full font-medium">
              NLT Translation
            </span>
          </div>
        </header>

        {/* Content Section with Strict Scoped Overrides */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-neutral-400 font-medium">
              Loading Holy Scripture...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/30 border border-red-900/50 rounded-2xl text-center space-y-4">
            <p className="text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-600/20"
            >
              Retry Reading
            </button>
          </div>
        ) : (
          <div className="bridge-bible-reader font-sans text-neutral-300 text-base sm:text-lg leading-relaxed">
            <style jsx global>{`
              .bridge-bible-reader * {
                font-family: inherit !important;
                color: inherit !important;
                background: transparent !important;
                font-style: normal !important; /* Removes all italics */
              }
              .bridge-bible-reader h2,
              .bridge-bible-reader h3,
              .bridge-bible-reader h4,
              .bridge-bible-reader .m-heading {
                font-size: 2rem !important;
                font-weight: 800 !important;
                color: #ffffff !important;
                margin-top: 2.5rem !important;
                margin-bottom: 1rem !important;
                padding-bottom: 0.5rem !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                letter-spacing: -0.025em !important;
                font-style: normal !important;
              }
              .bridge-bible-reader p {
                margin-bottom: 1.25rem !important;
                font-size: 1rem !important;
                color: #d4d4d4 !important;
                font-style: normal !important;
              }
              .bridge-bible-reader sup,
              .bridge-bible-reader .verse-num {
                color: #ff1a1a !important;
                font-size: 0.75rem !important;
                font-weight: 700 !important;
                margin-right: 0.35rem !important;
                user-select: none !important;
                font-style: normal !important;
              }
              /* Hide all footnote boxes (.tn, .note, .footnote, etc.) */
              .bridge-bible-reader .tn,
              .bridge-bible-reader .note,
              .bridge-bible-reader .footnote,
              .bridge-bible-reader aside,
              .bridge-bible-reader div[class*="tn"],
              .bridge-bible-reader span[class*="tn"],
              .bridge-bible-reader [class*="note"],
              .bridge-bible-reader [class*="footnote"],
              .bridge-bible-reader [class*="popup"] {
                display: none !important;
              }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        )}

        {/* Scroll Sentinel for Completion */}
        <div ref={bottomSentinelRef} className="h-6 w-full" />

        {/* Footer Actions */}
        <footer className="pt-8 border-t border-neutral-800 flex flex-col items-center gap-4">
          {completed ? (
            <div className="w-full py-4 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 font-semibold text-center flex items-center justify-center gap-2">
              <span>
                <Check />
              </span>{" "}
              Today’s completed!
            </div>
          ) : (
            <button
              disabled={!hasScrolledToBottom || loading || Boolean(error)}
              onClick={handleMarkAsRead}
              className={`w-full py-4 rounded-full font-bold transition-all shadow-xl ${
                hasScrolledToBottom && !loading && !error
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/25 cursor-pointer"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {hasScrolledToBottom ? "Mark as Read" : "Complete"}
            </button>
          )}
        </footer>
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none z-20" />
      </div>
    </main>
  );
}
