"use client";

import React from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa6";

export interface Reply {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
  replies?: Reply[];
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onReplySelect: (commentId: string, name: string) => void;
  isSubmitting?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReplySelect,
  isSubmitting = false,
}) => {
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="flex flex-col gap-3 py-3 border-b border-neutral-900/60 last:border-b-0 relative">
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
          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-200 shrink-0">
            {comment.name ? comment.name.charAt(0).toUpperCase() : "U"}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-neutral-400 truncate">
              {comment.name}
            </h4>
            <p className="text-sm font-medium text-neutral-100 mt-0.5 leading-snug wrap-break-word">
              {comment.text}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500 font-medium">
              <span>{comment.timestamp}</span>
              <span>•</span>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReplySelect(comment.id, comment.name)}
                className="hover:text-neutral-300 font-bold uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors"
              >
                REPLY
              </button>
            </div>
          </div>
        </div>

        {/* Like Button & Counter */}
        <div className="flex flex-col items-center shrink-0 pl-2">
          <button
            type="button"
            onClick={() => onLike(comment.id)}
            className={`p-1.5 rounded-full transition-transform active:scale-75 ${
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
          {comment.replies!.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3 relative">
              {/* Horizontal curve connecting to the vertical thread line */}
              <div
                aria-hidden="true"
                className="absolute -left-6 top-2.5 w-6 h-2 border-l-2 border-b-2 rounded-bl-xl border-neutral-900 pointer-events-none"
              />

              {/* Reply Avatar */}
              <div className="w-9 h-9 rounded-full bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center font-bold text-xs text-neutral-300 shrink-0 z-10">
                {reply.name ? reply.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* Reply Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-400 truncate">
                    {reply.name}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    • {reply.timestamp}
                  </span>
                </div>
                <p className="text-sm text-neutral-200 mt-0.5 leading-snug wrap-break-word">
                  {reply.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};