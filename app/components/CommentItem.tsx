/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaFire } from "react-icons/fa6";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { MILESTONE_MEDALS, Medal } from "@/lib/types/streak";

export interface Reply {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  avatarUrl?: string;
  authorUserId?: string;
  authorVerificationTier?: string | null;
  streakCount?: number;
  globalPosition?: number; // e.g. 1, 2, 3, 4...
}

export interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  avatarUrl?: string;
  authorUserId?: string;
  authorVerificationTier?: string | null;
  streakCount?: number;
  globalPosition?: number; // e.g. 1, 2, 3, 4...
  replies?: Reply[];
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReplySelect: (commentId: string, name: string) => void;
  isSubmitting?: boolean;
  activeReplyId?: string | null;
  activeReplyName?: string | null;
  isHighlighted?: boolean;
}

// Helper to convert numeric position to ordinal (1st, 2nd, 3rd, 4th, etc.)
function formatOrdinalPosition(pos?: number): string {
  if (!pos || pos <= 0) return "";
  const j = pos % 10;
  const k = pos % 100;
  if (j === 1 && k !== 11) return `${pos}st`;
  if (j === 2 && k !== 12) return `${pos}nd`;
  if (j === 3 && k !== 13) return `${pos}rd`;
  return `${pos}th`;
}

// Helper to get the correct milestone medal icon or fallback to FaFire
function renderStreakMedalIcon(streak: number) {
  // Find the highest milestone medal the user qualifies for based on targetDays
  const sortedMedals = [...MILESTONE_MEDALS].sort((a, b) => b.targetDays - a.targetDays);
  const earnedMedal = sortedMedals.find((m) => streak >= m.targetDays);

  const IconComponent = earnedMedal ? earnedMedal.icon : FaFire;
  const label = earnedMedal ? earnedMedal.name : "Streak";

  return (
    <span
      className="inline-flex items-center justify-center shrink-0 text-white drop-shadow-sm"
      title={`${label} (${streak} days)`}
    >
      <IconComponent className="w-3 h-3 text-white" />
    </span>
  );
}

// Helper Avatar Component with image error fallback to first letter
const CommentAvatar: React.FC<{
  avatarUrl?: string;
  name: string;
  className?: string;
}> = ({ avatarUrl, name, className = "w-9 h-9" }) => {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : "U";

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${className} rounded-full overflow-hidden bg-neutral-800 border border-neutral-700/80 shrink-0 z-10`}
      >
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0 z-10`}
    >
      {initial}
    </div>
  );
};

// Helper to highlight mention tags (@Name) in comment or reply body
const renderCommentBody = (text: string) => {
  if (!text) return null;
  const match = text.match(/^(@[^\s]+)\s+([\s\S]*)$/);
  if (match) {
    return (
      <>
        <span className="text-red-400 font-semibold inline-block mr-1">
          {match[1]}
        </span>
        {match[2]}
      </>
    );
  }
  return text;
};

// Reusable user metadata header (Name -> Verified Badge -> Current Milestone Medal -> Streak Count -> Global Position)
const UserMetaHeader: React.FC<{
  name: string;
  verificationTier?: string | null;
  streakCount?: number;
  globalPosition?: number;
}> = ({ name, verificationTier, streakCount = 0, globalPosition }) => {
  const ordinalPos = formatOrdinalPosition(globalPosition);

  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
      <h4 className="text-xs font-semibold text-neutral-400 truncate">
        {name}
      </h4>
      <VerifiedBadge tier={verificationTier} name={name} />

      {/* Streak Medal & Streak Count */}
      {streakCount > 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-300 bg-neutral-800/80 px-1.5 py-0.5 rounded-md border border-neutral-700/50">
          {renderStreakMedalIcon(streakCount)}
          <span className="text-[10px] font-bold text-orange-400">{streakCount}</span>
        </span>
      )}

      {/* Global Position */}
      {ordinalPos && (
        <span className="text-[10px] font-bold text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 tracking-wide">
          {ordinalPos}
        </span>
      )}
    </div>
  );
};

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReplySelect,
  isSubmitting = false,
  activeReplyId = null,
  activeReplyName = null,
  isHighlighted = false,
}) => {
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isParentReplying =
    activeReplyId === comment.id && activeReplyName === comment.name;

  return (
    <div
      id={`comment-${comment.id}`}
      className={`flex flex-col gap-3 py-3 border-b border-neutral-900/60 last:border-b-0 relative rounded-2xl transition-all duration-300 ${
        isHighlighted ? "bg-red-500/10 ring-1 ring-red-500/30 px-3 py-3" : ""
      }`}
    >
      {/* Dynamic Comment Line */}
      {hasReplies && (
        <div
          aria-hidden="true"
          className="absolute left-4 top-5 bottom-9 w-6 border-l-2 border-neutral-900 pointer-events-none rounded-xs z-0"
        />
      )}

      {/* Main Comment */}
      <div className="flex items-start justify-between gap-3 z-10">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <CommentAvatar avatarUrl={comment.avatarUrl} name={comment.name} />

          {/* Details */}
          <div className="flex-1 min-w-0">
            <UserMetaHeader
              name={comment.name}
              verificationTier={comment.authorVerificationTier}
              streakCount={comment.streakCount}
              globalPosition={comment.globalPosition}
            />
            <p className="text-sm font-medium text-neutral-100 mt-0.5 leading-snug wrap-break-word">
              {renderCommentBody(comment.text)}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 font-medium flex-wrap">
              <span>{comment.timestamp}</span>
              <span>•</span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReplySelect(comment.id, comment.name)}
                className={`font-bold uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors cursor-pointer ${
                  isParentReplying
                    ? "text-red-400 font-extrabold"
                    : "hover:text-neutral-300"
                }`}
              >
                REPLY
              </button>
              {isParentReplying && (
                <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Replying
                </span>
              )}
              {hasReplies && (
                <>
                  <span>•</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">
                    {comment.replies!.length} {comment.replies!.length === 1 ? "reply" : "replies"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Like Button & Counter */}
        <div className="flex flex-col items-center shrink-0 pl-2">
          <button
            type="button"
            onClick={() => onLike(comment.id)}
            className={`p-1.5 rounded-full transition-transform active:scale-75 cursor-pointer ${
              comment.liked
                ? "text-red-500"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            aria-label="Like comment"
          >
            {comment.liked ? (
              <FaHeart className="w-4 h-4" />
            ) : (
              <FaRegHeart className="w-4 h-4" />
            )}
          </button>
          <span className="text-[10px] font-semibold text-neutral-400">
            {comment.likes > 0 ? comment.likes : ""}
          </span>
        </div>
      </div>

      {/* Nested Replies Container */}
      {hasReplies && (
        <div className="ml-10 space-y-3 mt-1 z-10">
          {comment.replies!.map((reply) => {
            const isReplyReplying =
              activeReplyId === comment.id && activeReplyName === reply.name;

            return (
              <div key={reply.id} className="flex items-start gap-3 relative">
                {/* Horizontal curve connecting to the vertical thread line */}
                <div
                  aria-hidden="true"
                  className="absolute -left-6 top-2.5 w-6 h-2 border-l-2 border-b-2 rounded-bl-xl border-neutral-900 pointer-events-none"
                />

                {/* Reply Avatar */}
                <CommentAvatar avatarUrl={reply.avatarUrl} name={reply.name} />

                {/* Reply Details */}
                <div className="flex-1 min-w-0">
                  <UserMetaHeader
                    name={reply.name}
                    verificationTier={reply.authorVerificationTier}
                    streakCount={reply.streakCount}
                    globalPosition={reply.globalPosition}
                  />
                  <p className="text-sm text-neutral-200 mt-0.5 leading-snug wrap-break-word">
                    {renderCommentBody(reply.text)}
                  </p>
                  
                  {/* Footer toolbar: Reply action + Timestamp moved here for clean spacing */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 font-medium flex-wrap">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onReplySelect(comment.id, reply.name)}
                      className={`font-bold uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors cursor-pointer ${
                        isReplyReplying
                          ? "text-red-400 font-extrabold"
                          : "hover:text-neutral-300"
                      }`}
                    >
                      REPLY
                    </button>
                    {isReplyReplying && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                        Replying
                      </span>
                    )}
                    <span>•</span>
                    <span>{reply.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
