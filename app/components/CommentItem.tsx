/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { FaHeart, FaRegHeart, FaFire, FaRegComment } from "react-icons/fa6";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

export interface Reply {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  avatarUrl?: string;
  authorUserId?: string;
  authorVerificationTier?: string | null;
  streakCount?: number;
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

// Helper Avatar Component with image error fallback to first letter
// Small fire badge showing the author's current streak (counted from their completed days)
const StreakBadge: React.FC<{ count?: number }> = ({ count }) =>
  count && count > 0 ? (
    <span
      title={`${count}-day streak`}
      className="inline-flex items-start  gap-0.5 text-[10px] font-semibold text-white/60 shrink-0"
    >
      <FaFire className="size-2.5 mt-px" />
      {count}
    </span>
  ) : null;

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
      className={`flex flex-col mb-6 pb-3 border-b border-white/15 last:border-b-0 relative transition-all duration-300 ${
        isHighlighted ? "bg-red-500/10 ring-1 ring-red-500/30 px-3 py-3" : ""
      }`}
    >
      {/* Dynamic Comment Line */}
      {hasReplies && (
        <div
          aria-hidden="true"
          className="absolute left-4 top-5 bottom-12 w-6 border-l-2 border-white/15 pointer-events-none rounded-xs z-0"
        />
      )}

      {/* Main Comment */}
      <div className="flex items-start justify-between gap-3 z-10">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <CommentAvatar avatarUrl={comment.avatarUrl} name={comment.name} />

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h4 className="text-xs font-semibold text-neutral-400 truncate">
                {comment.name}
              </h4>
              <VerifiedBadge
                tier={comment.authorVerificationTier}
                name={comment.name}
                showLabel
              />
                <span></span>
              <StreakBadge count={comment.streakCount} />
            </div>
            <p className="text-sm font-medium text-neutral-100 mt-0.5 leading-snug wrap-break-word">
              {renderCommentBody(comment.text)}
            </p>
            <div
              className={`flex items-center gap-3 mt-3 pb-3 ${hasReplies ? "border-b border-white/15" : ""} text-[11px] text-neutral-500 font-medium flex-wrap`}
            >
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReplySelect(comment.id, comment.name)}
                className={`font-bold flex gap-1 items-center uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors cursor-pointer ${
                  isParentReplying
                    ? "text-red-400 font-extrabold"
                    : "hover:text-neutral-300"
                }`}
              >
                <FaRegComment className="size-4" /> {comment.replies!.length}
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onLike(comment.id)}
                className={`flex gap-1 items-center rounded-full transition-transform active:scale-95 cursor-pointer ${
                  comment.liked
                    ? "text-red-500"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
                aria-label="Like comment"
              >
                {comment.liked ? (
                  <FaHeart className="size-4" />
                ) : (
                  <FaRegHeart className="size-4" />
                )}
                <span className="text-[10px] font-semibold text-neutral-400">
                  {comment.likes > 0 ? comment.likes : ""}
                </span>
              </button>
              <span>•</span>
              <span>{comment.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies Container */}
      {hasReplies && (
        <div className=" space-y-3 mt-3 z-10">
          {comment.replies!.map((reply) => {
            const isReplyReplying =
              activeReplyId === comment.id && activeReplyName === reply.name;

            return (
              <div key={reply.id} className="flex items-start gap-3 relative ">
                {/* Reply Avatar */}
                <CommentAvatar avatarUrl={reply.avatarUrl} name={reply.name} />

                {/* Reply Details */}
                <div className="flex-1 min-w-0 pb-2 ">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-neutral-400 truncate">
                      {reply.name}
                    </span>
                    <VerifiedBadge
                      tier={reply.authorVerificationTier}
                      name={reply.name}
                       showLabel
                    />
                    <StreakBadge count={reply.streakCount} />
                    <span className="text-[10px] text-neutral-500">
                      • {reply.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-200 mt-0.5 leading-snug wrap-break-word">
                    {renderCommentBody(reply.text)}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-medium">
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
