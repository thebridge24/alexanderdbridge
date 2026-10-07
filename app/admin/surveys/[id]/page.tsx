"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Calendar, User, Mail, DollarSign, HeartHandshake } from "lucide-react";
import { devotionalSurveyConfig } from "../../../../config/devotionalSurvey";

// Mock database lookup (Replace with Supabase or API call)
const MOCK_SUBMISSIONS_DB: Record<string, any> = {
  "sub-101": {
    id: "sub-101",
    userName: "Emmanuel Oke",
    userEmail: "emmanuel@example.com",
    submittedAt: "2026-10-06T14:30:00Z",
    answers: {
      rating_overall: 5,
      like_most: "The daily depth and focus on personal spiritual growth.",
      excites_most: "Being part of a close-knit spiritual community.",
      helped_walk_with_god: "It has helped me stay consistent with daily prayer and word study.",
      impactful_moment: "The devotional on 'Walking in Grace' completely shifted my perspective.",
      dislikes_or_difficulties: "Nothing really, just looking forward to push notifications.",
      wish_feature: "Daily audio devotionals",
      consistency_drivers: ["audio", "reminders", "journal"],
      membership_willingness: "yes_definitely",
      monthly_amount: "1000",
    },
  },
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const submissionId = params.id as string;

  // Retrieve submission from database/mock store
  const submission = MOCK_SUBMISSIONS_DB[submissionId] || {
    id: submissionId,
    userName: "Alexander Bridge",
    userEmail: "alexander@example.com",
    submittedAt: new Date().toISOString(),
    answers: {
      rating_overall: 5,
      like_most: "Deep spiritual insights and clean reading experience.",
      excites_most: "Growing with a dedicated community.",
      helped_walk_with_god: "Yes, it brings clarity every morning.",
      impactful_moment: "The study on faith in difficult seasons.",
      dislikes_or_difficulties: "No major issues encountered.",
      wish_feature: "Built-in prayer requests",
      consistency_drivers: ["reminders", "audio", "prayer"],
      membership_willingness: "yes_definitely",
      monthly_amount: "2000",
    },
  };

  // Format array/object answers into readable text
  const formatAnswerValue = (q: any, answerValue: any) => {
    if (answerValue === undefined || answerValue === null || answerValue === "") {
      return <span className="text-neutral-600 italic">No response provided</span>;
    }

    if (q.type === "rating") {
      return (
        <div className="flex items-center gap-1.5 text-red-500 font-bold">
          <span>{answerValue} / 5</span>
          <Star className="w-4 h-4 fill-red-500" />
        </div>
      );
    }

    if (q.type === "multiple-choice" && Array.isArray(answerValue)) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {answerValue.map((item: any, idx: number) => {
            const label =
              typeof item === "object"
                ? `Other: ${item.text}`
                : q.options?.find((o: any) => o.value === item)?.label || item;
            return (
              <span
                key={idx}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs px-2.5 py-1 rounded-lg"
              >
                {label}
              </span>
            );
          })}
        </div>
      );
    }

    if (q.type === "single-choice") {
      if (typeof answerValue === "object") {
        return `Other: ${answerValue.text}`;
      }
      return q.options?.find((o: any) => o.value === answerValue)?.label || answerValue;
    }

    return <p className="text-neutral-200 leading-relaxed text-xs sm:text-sm">{String(answerValue)}</p>;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <Link
            href="/admin/surveys"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All Responses
          </Link>
          <span className="text-xs font-mono text-neutral-500">
            ID: {submission.id}
          </span>
        </div>

        {/* User Summary Header Card */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-500 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full">
              Respondent Overview
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 mt-1">
              <User className="w-5 h-5 text-neutral-400" />
              {submission.userName || "Anonymous Respondent"}
            </h1>
            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {submission.userEmail || "No Email Provided"}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(submission.submittedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 px-4 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                Overall Rating
              </span>
              <span className="text-base font-bold text-white">
                {submission.answers.rating_overall || "N/A"} / 5
              </span>
            </div>
            <Star className="w-6 h-6 fill-red-500 text-red-500" />
          </div>
        </div>

        {/* Question-by-Question Answers Display */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-neutral-500 pt-2">
            Detailed Answers ({devotionalSurveyConfig.questions.length} Questions)
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {devotionalSurveyConfig.questions.map((question, index) => {
              const answerVal = submission.answers[question.id];

              return (
                <div
                  key={question.id}
                  className="bg-neutral-950 border border-neutral-800/80 rounded-2xl p-4 sm:p-5 space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-neutral-500">
                      Q{String(index + 1).padStart(2, "0")}
                    </span>
                    {question.required && (
                      <span className="text-[10px] font-mono text-red-500/80">Required</span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-300">
                    {question.title}
                  </h3>

                  <div className="pt-2 border-t border-neutral-900 text-xs sm:text-sm">
                    {formatAnswerValue(question, answerVal)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
