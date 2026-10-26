/* eslint-disable react-hooks/set-state-in-effect */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getReadingForDate, getDayOfYear } from '../../services/biblePlan';
import { getStoredState, isDayCompleted, joinMovement } from '../../services/studyStorage';
import { Check } from 'lucide-react';

interface BibleStudyCardProps {
  dateString?: string; // e.g. "2026-10-21"
}

export default function BibleStudyCard({ dateString }: BibleStudyCardProps) {
  // Resolve reading based on devotional date if provided, otherwise fallback to today
  const targetDate = dateString ? new Date(dateString) : new Date();
  const reading = getReadingForDate(targetDate);
  const dayOfYear = getDayOfYear(targetDate);

  const [completed, setCompleted] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const state = getStoredState();
    setJoined(state.joined);
    setCompleted(isDayCompleted(dayOfYear));
  }, [dayOfYear]);

  const handleJoin = () => {
    joinMovement();
    setJoined(true);
  };

  return (
    <section className="mt-12 rounded-2xl bg-black border border-red-900/30 p-6 md:p-8 text-white shadow-xl">
      <div className="flex flex-col items-start justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            The 365 Bible Study Movement
          </span>
          <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            One year. One Bible. A daily journey.
          </h3>
          <p className="text-neutral-400 text-sm">
            Read through all 66 books of Scripture with Bridge Daily.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="text-xs bg-neutral-800 text-neutral-300 px-3 py-1 rounded-full border border-neutral-700">
              Reading: <strong className="text-white">{reading.reference}</strong>
            </span>
            {completed && (
              <span className="flex items-center gap-0.5Z text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full">
                <Check className='size-4' /> Completed
              </span>
            )}
          </div>
        </div>

        <div className='w-full'>
          <Link
            href={`/study/365?date=${dateString || ''}`}
            onClick={handleJoin}
            className="inline-flex w-full items-center justify-center px-6 py-3 rounded-full bg-red-600 hover:bg-primary text-white font-semibold transition-all shadow-lg hover:shadow-red-600/30"
          >
            {completed ? 'Revisit Reading' : joined ? 'Continue Reading' : 'Join the Movement'}
          </Link>
        </div>
      </div>
    </section>
  );
}