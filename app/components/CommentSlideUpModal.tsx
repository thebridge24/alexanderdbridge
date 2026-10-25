/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoCloseCircle, IoSend } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import { Comment, CommentItem } from "./CommentItem";
import Preloader from "./ui/Preloader";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { getUserVerificationTier } from "@/lib/utils/verification";

interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

interface CommentSlideUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  commentText: string;
  setCommentText: (text: string) => void;
  onSubmitComment: (e: React.FormEvent) => void;
  onLikeComment: (commentId: string) => void;
  replyingToId: string | null;
  replyingToName: string | null;
  setReplyingTo: (id: string | null, name: string | null) => void;
  isSubmitting: boolean;
  userInitial?: string;
  userAvatarUrl?: string;
  userName?: string;
  highlightedCommentId?: string | null;
}

// Helper Avatar Component for the current user input bar
const CurrentUserAvatar: React.FC<{
  avatarUrl?: string;
  initial?: string;
  name?: string;
}> = ({ avatarUrl, initial = "U", name = "User" }) => {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0 mb-1">
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
    <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-white shrink-0 mb-1">
      {initial}
    </div>
  );
};

export const CommentSlideUpModal: React.FC<CommentSlideUpModalProps> = ({
  isOpen,
  onClose,
  comments,
  commentText,
  setCommentText,
  onSubmitComment,
  onLikeComment,
  replyingToId,
  replyingToName,
  setReplyingTo,
  isSubmitting,
  userInitial = "U",
  userAvatarUrl,
  userName = "User",
  highlightedCommentId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // User Mention List & Filter State
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [showMentionSlider, setShowMentionSlider] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionMatchIndex, setMentionMatchIndex] = useState<number>(-1);

  // Fetch registered users for @ mentions when modal is opened
  useEffect(() => {
    async function fetchMentionUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.users || []);
        }
      } catch (err) {
        console.error("Failed to load users for mention slider:", err);
      }
    }
    if (isOpen) {
      fetchMentionUsers();
    }
  }, [isOpen]);

  // Detect "@" symbol input and position in text area
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorIndex = e.target.selectionStart;
    setCommentText(text);

    // Look backward from cursor position to find the last @ symbol
    const textBeforeCursor = text.slice(0, cursorIndex);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1) {
      const queryAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      // Ensure there are no spaces in the query string after @
      if (!queryAfterAt.includes(" ")) {
        setMentionQuery(queryAfterAt);
        setMentionMatchIndex(lastAtPos);
        setShowMentionSlider(true);
        return;
      }
    }

    setShowMentionSlider(false);
  };

  // Filter users based on query after @
  const filteredMentionUsers = useMemo(() => {
    if (!mentionQuery.trim()) return allUsers;
    return allUsers.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(mentionQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [allUsers, mentionQuery]);

  // Insert tagged user name into comment textarea
  const handleSelectMentionUser = (user: MentionUser) => {
    if (mentionMatchIndex === -1) return;

    const nameToInsert = user.name || user.email.split("@")[0];
    const beforeAt = commentText.slice(0, mentionMatchIndex);
    const afterAtQuery = commentText.slice(mentionMatchIndex + 1 + mentionQuery.length);

    const updatedText = `${beforeAt}@${nameToInsert} ${afterAtQuery}`;
    setCommentText(updatedText);
    setShowMentionSlider(false);

    // Focus back to textarea and place cursor after tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeAt.length + nameToInsert.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [commentText]);

  // Handle auto-focus and cursor positioning when selecting a reply target
  useEffect(() => {
    if (replyingToName && textareaRef.current) {
      textareaRef.current.focus();
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [replyingToName, replyingToId]);

  // Auto-scroll to highlighted comment when opened via deep-link
  useEffect(() => {
    if (isOpen && highlightedCommentId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`comment-${highlightedCommentId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, highlightedCommentId]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleReplySelect = (id: string, name: string) => {
    setReplyingTo(id, name);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const handleClearReply = () => {
    setReplyingTo(null, null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Slide-Up Bottom Sheet Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto h-[75vh] max-h-162.5 bg-black border-t border-neutral-800 rounded-t-4xl z-50 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Top Handle Bar */}
            <div className="w-full flex flex-col items-center pt-3 pb-2 shrink-0 relative border-b border-neutral-900">
              <div className="w-12 h-1 bg-neutral-700 rounded-full mb-3" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Comments
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-4 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close comments"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Comments List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-2 pb-32">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <p className="text-sm font-medium text-neutral-500">
                    No comments yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false} mode="sync">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onLike={onLikeComment}
                      onReplySelect={handleReplySelect}
                      isSubmitting={isSubmitting}
                      activeReplyId={replyingToId}
                      activeReplyName={replyingToName}
                      isHighlighted={highlightedCommentId === comment.id}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Mentions Slider (Appears Above Input Bar) */}
            <AnimatePresence>
              {showMentionSlider && filteredMentionUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute bottom-16 left-4 right-4 z-30 max-h-48 overflow-y-auto no-scrollbar bg-neutral-950 border border-neutral-800 rounded-2xl p-2 shadow-2xl divide-y divide-neutral-900"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    Tag a Member
                  </div>
                  {filteredMentionUsers.map((user) => {
                    const userTier = getUserVerificationTier({
                      metadata: user.metadata,
                      email: user.email,
                      name: user.name,
                    });

                    return (
                      <div
                        key={user.id}
                        onClick={() => handleSelectMentionUser(user)}
                        className="flex items-center gap-3 p-2 hover:bg-neutral-900/80 cursor-pointer transition-colors"
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || "User Avatar"}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                            <FaUser className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {user.name || "Believer"}
                            </span>
                            {userTier && (
                              <VerifiedBadge
                                tier={userTier}
                                name={user.name}
                                email={user.email}
                                size="sm"
                              />
                            )}
                          </div>
                          <span className="block text-[10px] text-neutral-500 font-mono truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Section */}
            <div className="p-4 shrink-0 absolute bottom-0 z-10 left-0 w-full bg-linear-to-t from-black via-black/90 to-transparent">
              <form onSubmit={onSubmitComment} className="flex items-end gap-3">
                {/* User Avatar / Fallback Initial */}
                <CurrentUserAvatar
                  avatarUrl={userAvatarUrl}
                  initial={userInitial}
                  name={userName}
                />

                {/* Input Container */}
                <div className="relative flex-1 bg-black border border-neutral-800 rounded-3xl p-2.5 focus-within:border-neutral-700 transition-colors">
                  {/* Floating Tag (Pinned Top-Left) */}
                  {replyingToName && (
                    <div className="float-left mr-2 mb-1">
                      <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-full select-none">
                        @{replyingToName}
                        <button
                          type="button"
                          onClick={handleClearReply}
                          className="hover:text-red-400 focus:outline-none cursor-pointer"
                          aria-label="Remove mention"
                        >
                          <IoCloseCircle className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={
                      replyingToName ? "Write a reply..." : "Comment... (Type @ to tag someone)"
                    }
                    value={commentText}
                    onChange={handleTextareaChange}
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none resize-none no-scrollbar max-h-28 leading-relaxed block"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:bg-neutral-800 disabled:text-neutral-600 active:scale-90 transition-all mb-0.5 cursor-pointer"
                  aria-label="Send comment"
                >
                  {!isSubmitting ? (
                    <IoSend className="w-4 h-4 ml-0.5" />
                  ) : (
                    <Preloader className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
