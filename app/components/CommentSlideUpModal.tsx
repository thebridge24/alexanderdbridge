"use client";

import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoCloseCircle, IoSend } from "react-icons/io5";
import { Comment, CommentItem } from "./CommentItem";

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
}

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
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
                className="absolute right-5 top-4 p-1 text-neutral-400 hover:text-white transition-colors"
                aria-label="Close comments"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Comments List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar space-y-2">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <p className="text-sm font-medium text-neutral-500">
                    No comments yet. Start the conversation!
                  </p>
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onLike={onLikeComment}
                    onReplySelect={handleReplySelect}
                    isSubmitting={isSubmitting}
                  />
                ))
              )}
            </div>

            {/* Input Section */}
            <div className="p-4 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur-md shrink-0">
              <form
                onSubmit={onSubmitComment}
                className="flex items-end gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-white shrink-0 mb-1">
                  {userInitial}
                </div>

                {/* Input Container */}
                <div className="relative flex-1 bg-neutral-900 border border-neutral-800 rounded-3xl p-2.5 focus-within:border-neutral-700 transition-colors">
                  {/* Floating Tag (Pinned Top-Left) */}
                  {replyingToName && (
                    <div className="float-left mr-2 mb-1">
                      <span className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold px-2 py-0.5 rounded-full select-none">
                        @{replyingToName}
                        <button
                          type="button"
                          onClick={handleClearReply}
                          className="hover:text-red-400 focus:outline-none"
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
                      replyingToName ? "Write a reply..." : "Your Comment..."
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none resize-none no-scrollbar max-h-28 leading-relaxed block"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0 disabled:bg-neutral-800 disabled:text-neutral-600 active:scale-90 transition-all mb-0.5"
                  aria-label="Send comment"
                >
                  <IoSend className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};