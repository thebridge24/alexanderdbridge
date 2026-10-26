/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getReadingForDate } from '../../services/biblePlan';
import { isDayCompleted, markDayCompleted } from '../../services/studyStorage';

export default function StudyPage() {
  const reading = getReadingForDate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [completed, setCompleted] = useState(false);

  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCompleted(isDayCompleted(reading.dayOfYear));

    async function fetchPassage() {
      try {
        setLoading(true);
        const res = await fetch(`/api/bible?ref=${encodeURIComponent(reading.reference)}`);
        if (!res.ok) throw new Error('Could not fetch reading text.');
        const data = await res.json();
        setContent(data.htmlContent);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPassage();
  }, [reading.dayOfYear, reading.reference]);

  useEffect(() => {
    if (!bottomSentinelRef.current || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasScrolledToBottom(true);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, [loading]);

  const handleMarkAsRead = () => {
    markDayCompleted(reading.dayOfYear, reading.reference);
    setCompleted(true);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4 border-b border-neutral-800 pb-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
            ← Return to Devotional
          </Link>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Day {reading.dayOfYear} of 365
            </span>
            <span className="text-xs bg-neutral-800 text-neutral-400 px-2.5 py-1 rounded">
              NLT Translation
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black">{reading.reference}</h1>
        </header>

        {loading ? (
          <div className="py-20 text-center text-neutral-500">Loading Holy Scripture...</div>
        ) : error ? (
          <div className="p-6 bg-red-950/40 border border-red-800 rounded-xl text-center space-y-4">
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 rounded text-sm font-semibold">
              Retry
            </button>
          </div>
        ) : (
          <article
            className="prose prose-invert max-w-none prose-p:text-neutral-300 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        <div ref={bottomSentinelRef} className="h-4 w-full" />

        <footer className="pt-8 border-t border-neutral-800 flex flex-col items-center gap-4">
          {completed ? (
            <div className="text-emerald-400 font-semibold flex items-center gap-2">
              ✓ Today’s reading completed!
            </div>
          ) : (
            <button
              disabled={!hasScrolledToBottom}
              onClick={handleMarkAsRead}
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                hasScrolledToBottom
                  ? 'bg-red-600 hover:bg-primary text-white shadow-lg cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {hasScrolledToBottom ? 'Mark as Read' : 'Scroll to bottom to complete'}
            </button>
          )}
        </footer>
      </div>
    </main>
  );
}