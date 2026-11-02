/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHeart,
  FaRegHeart,
  FaFire,
  FaRegComment,
  FaEllipsisVertical,
} from "react-icons/fa6";
import { FiBarChart2 } from "react-icons/fi";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { CommentOptionSliderUp } from "@/app/components/CommentOptionSliderUp";

export interface Reply {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  likes?: number;
  liked?: boolean;
  impressions?: number;
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
  impressions?: number;
  avatarUrl?: string;
  authorUserId?: string;
  authorVerificationTier?: string | null;
  streakCount?: number;
  replies?: Reply[];
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onLike: (commentId: string, replyId?: string) => void;
  onReplySelect: (commentId: string, name: string) => void;
  onEdit?: (commentId: string, text: string, replyId?: string) => void;
  onDelete?: (commentId: string, replyId?: string) => void;
  onShare?: (text: string) => void;
  userTier?: string | null;
  onRequireUpgrade: () => void;
  isSubmitting?: boolean;
  activeReplyId?: string | null;
  activeReplyName?: string | null;
  isHighlighted?: boolean;
  onAvatarClick?: (author: Comment | Reply) => void;
}

const ALLOWED_TIERS = [
  "reader",
  "supporter",
  "partner",
  "sponsor",
  "patron",
  "visionary",
];

const StreakBadge: React.FC<{ count?: number }> = ({ count }) =>
  count && count > 0 ? (
    <span
      title={`${count}-day streak`}
      className="inline-flex items-start gap-0.5 text-[10px] font-semibold text-white/60 shrink-0"
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

const renderCommentBody = (text: string) => {
  if (!text) return null;
  const words = text.split(" ");
  return (
    <>
      {words.map((word, idx) => {
        const isMention = word.startsWith("@") && word.length > 1;
        return (
          <React.Fragment key={idx}>
            {isMention ? (
              <span className="text-primary font-bold">{word}</span>
            ) : (
              word
            )}
            {idx < words.length - 1 ? " " : ""}
          </React.Fragment>
        );
      })}
    </>
  );
};

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onLike,
  onReplySelect,
  onEdit,
  onDelete,
  onShare,
  userTier,
  onRequireUpgrade,
  onAvatarClick,
  isSubmitting = false,
  activeReplyId = null,
  activeReplyName = null,
  isHighlighted = false,
}) => {
  const [activeMenuTarget, setActiveMenuTarget] = useState<{
    id: string;
    type: "comment" | "reply";
    text: string;
    authorId?: string;
  } | null>(null);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isParentReplying =
    activeReplyId === comment.id && activeReplyName === comment.name;

  // Show three dots ONLY if the signed in user is the author of this comment
  const isCommentOwner = Boolean(
    currentUserId &&
    comment.authorUserId &&
    currentUserId === comment.authorUserId,
  );
  
console.log("Comment ownership check:", {
  currentUserId,
  commentAuthorId: comment.authorUserId,
  isCommentOwner,
  userTier,
});

  const checkTierAndExecute = (action: () => void) => {
    const normalizedTier = (userTier || "").toLowerCase().trim();
    if (!ALLOWED_TIERS.includes(normalizedTier)) {
      onRequireUpgrade();
    } else {
      action();
    }
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{
        opacity: { duration: 0.22, ease: "easeOut" },
        scale: { duration: 0.28, ease: "easeOut" },
        y: { type: "spring", stiffness: 380, damping: 32, mass: 0.7 },
        layout: { type: "spring", stiffness: 420, damping: 38 },
      }}
      id={`comment-${comment.id}`}
      className={`flex flex-col mb-6 pb-3 border-b border-white/15 last:border-b-0 relative ${
        isHighlighted ? "bg-primary/10 ring-1 ring-primary/30 px-3 py-3" : ""
      }`}
    >
      {/* Thread Connecting Line for Replies */}
      {hasReplies && (
        <div
          aria-hidden="true"
          className="absolute left-4 top-5 bottom-12 w-6 border-l-2 border-white/15 pointer-events-none rounded-xs z-0"
        />
      )}

      {/* Main Comment Row */}
      <div className="flex items-start justify-between gap-3 z-10">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onAvatarClick?.(comment)}
            aria-label={`View ${comment.name}'s profile`}
            className="rounded-full shrink-0 cursor-pointer"
          >
            <CommentAvatar avatarUrl={comment.avatarUrl} name={comment.name} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <h4 className="text-xs font-semibold text-neutral-400 truncate max-w-32">
                  {comment.name}
                </h4>
                <VerifiedBadge
                  tier={comment.authorVerificationTier}
                  name={comment.name}
                  showLabel
                />
                <StreakBadge count={comment.streakCount} />
              </div>

              {/* Three dots button - Owner only */}
              {isCommentOwner && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveMenuTarget({
                      id: comment.id,
                      type: "comment",
                      text: comment.text,
                      authorId: comment.authorUserId,
                    })
                  }
                  className="p-1.5 text-neutral-500 hover:text-white rounded-full transition-colors cursor-pointer"
                  aria-label="Comment options"
                >
                  <FaEllipsisVertical className="size-3.5" />
                </button>
              )}
            </div>

            <p className="text-sm font-medium text-neutral-100 mt-0.5 leading-snug wrap-break-word">
              {renderCommentBody(comment.text)}
            </p>

            {/* Interaction Bar */}
            <div
              className={`flex items-center gap-4 mt-3 pb-3 ${
                hasReplies ? "border-b border-white/15" : ""
              } text-[11px] text-neutral-500 font-medium flex-wrap`}
            >
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onReplySelect(comment.id, comment.name)}
                className={`font-bold flex gap-1.5 items-center uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors cursor-pointer ${
                  isParentReplying
                    ? "text-red-400 font-extrabold"
                    : "hover:text-neutral-300"
                }`}
              >
                <FaRegComment className="size-4" />
                <span>{comment.replies!.length}</span>
              </button>

              <button
                type="button"
                onClick={() => onLike(comment.id)}
                className={`flex gap-1.5 items-center rounded-full transition-transform active:scale-95 cursor-pointer ${
                  comment.liked
                    ? "text-primary"
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

              <div className="flex gap-1.5 items-center text-neutral-500">
                <FiBarChart2 className="size-4" />
                <span className="text-[10px] font-semibold text-neutral-400">
                  {comment.impressions ?? 12}
                </span>
              </div>

              <span className="ml-auto text-[10px]">{comment.timestamp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div className="space-y-3 mt-3 z-10">
          <AnimatePresence initial={false} mode="sync">
            {comment.replies!.map((reply) => {
              const isReplyReplying =
                activeReplyId === comment.id && activeReplyName === reply.name;
              const isReplyOwner = Boolean(
                currentUserId &&
                reply.authorUserId &&
                currentUserId === reply.authorUserId,
              );

              return (
                <motion.div
                  key={reply.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-start gap-3 relative"
                >
                  <button
                    type="button"
                    onClick={() => onAvatarClick?.(reply)}
                    aria-label={`View ${reply.name}'s profile`}
                    className="rounded-full shrink-0 cursor-pointer"
                  >
                    <CommentAvatar
                      avatarUrl={reply.avatarUrl}
                      name={reply.name}
                    />
                  </button>

                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-neutral-400 truncate max-w-32">
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

                      {/* Three dots for reply author */}
                      {isReplyOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuTarget({
                              id: reply.id,
                              type: "reply",
                              text: reply.text,
                              authorId: reply.authorUserId,
                            })
                          }
                          className="p-1 text-neutral-500 hover:text-white rounded-full transition-colors cursor-pointer"
                          aria-label="Reply options"
                        >
                          <FaEllipsisVertical className="size-3" />
                        </button>
                      )}
                    </div>

                    <p className="text-sm text-neutral-200 mt-0.5 leading-snug wrap-break-word">
                      {renderCommentBody(reply.text)}
                    </p>

                    {/* Reply Interaction Bar */}
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-neutral-500 font-medium">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => onReplySelect(comment.id, reply.name)}
                        className={`font-bold flex gap-1.5 items-center uppercase tracking-wider text-[10px] disabled:opacity-50 transition-colors cursor-pointer ${
                          isReplyReplying
                            ? "text-red-400 font-extrabold"
                            : "hover:text-neutral-300"
                        }`}
                      >
                        <FaRegComment className="size-4" />
                        <span>{comment.replies!.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onLike(comment.id, reply.id)}
                        className={`flex gap-1.5 items-center rounded-full transition-transform active:scale-95 cursor-pointer ${
                          reply.liked
                            ? "text-primary"
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                        aria-label="Like reply"
                      >
                        {reply.liked ? (
                          <FaHeart className="size-3.5" />
                        ) : (
                          <FaRegHeart className="size-3.5" />
                        )}
                        <span className="text-[10px] font-semibold text-neutral-400">
                          {(reply.likes ?? 0) > 0 ? reply.likes : ""}
                        </span>
                      </button>

                      <div className="flex gap-1 items-center text-neutral-500">
                        <FiBarChart2 className="size-3.5" />
                        <span className="text-[10px] font-semibold text-neutral-400">
                          {reply.impressions ?? 4}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Reusable Plain-Black Slide Up Sheet for Actions */}
      <CommentOptionSliderUp
        isOpen={activeMenuTarget !== null}
        onClose={() => setActiveMenuTarget(null)}
        isOwner={true}
        onEdit={() => {
          if (!activeMenuTarget) return;
          checkTierAndExecute(() => {
            if (activeMenuTarget.type === "comment") {
              onEdit?.(activeMenuTarget.id, activeMenuTarget.text);
            } else {
              onEdit?.(comment.id, activeMenuTarget.text, activeMenuTarget.id);
            }
          });
        }}
        onDelete={() => {
          if (!activeMenuTarget) return;
          checkTierAndExecute(() => {
            if (activeMenuTarget.type === "comment") {
              onDelete?.(activeMenuTarget.id);
            } else {
              onDelete?.(comment.id, activeMenuTarget.id);
            }
          });
        }}
        onShare={() => {
          if (!activeMenuTarget) return;
          onShare?.(activeMenuTarget.text);
        }}
      />
    </motion.div>
  );
};
