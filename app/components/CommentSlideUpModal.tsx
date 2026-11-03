/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoCloseCircle, IoSend } from "react-icons/io5";
import { FaUser, FaCrown } from "react-icons/fa6";
import { Comment, CommentItem, Reply } from "./CommentItem";
import Preloader from "./ui/Preloader";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { getUserVerificationTier } from "@/lib/utils/verification";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  UserProfilePopup,
  type UserProfileData,
} from "@/app/components/ui/UserProfilePopup";

interface MentionUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  banner_url?: string;
  currentStreak?: number;
  highestStreak?: number;
  followersCount?: number;
  isFollowing?: boolean;
  verification_tier?: string | null;
  metadata?: Record<string, any>;
}

interface CommentSlideUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  commentText: string;
  setCommentText: (text: string) => void;
  onSubmitComment: (e: React.FormEvent, mentionedUserIds: string[]) => void;
  onLikeComment: (commentId: string, replyId?: string) => void;
  onEditComment?: (commentId: string, text: string, replyId?: string) => void;
  onDeleteComment?: (commentId: string, replyId?: string) => void;
  replyingToId: string | null;
  replyingToName: string | null;
  setReplyingTo: (id: string | null, name: string | null) => void;
  isSubmitting: boolean;
  userInitial?: string;
  userAvatarUrl?: string;
  userName?: string;
  userTier?: string | null;
  highlightedCommentId?: string | null;
  currentUserId?: string;
}

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
  onEditComment,
  onDeleteComment,
  replyingToId,
  replyingToName,
  setReplyingTo,
  isSubmitting,
  userInitial = "U",
  userAvatarUrl,
  userName = "User",
  userTier,
  highlightedCommentId,
  currentUserId,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [showMentionSlider, setShowMentionSlider] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionMatchIndex, setMentionMatchIndex] = useState<number>(-1);
  const [pickedMentions, setPickedMentions] = useState<MentionUser[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const cursorIndex = e.target.selectionStart;
    setCommentText(text);

    const textBeforeCursor = text.slice(0, cursorIndex);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1) {
      const queryAfterAt = textBeforeCursor.slice(lastAtPos + 1);
      if (!queryAfterAt.includes(" ")) {
        setMentionQuery(queryAfterAt);
        setMentionMatchIndex(lastAtPos);
        setShowMentionSlider(true);
        return;
      }
    }

    setShowMentionSlider(false);
  };

  const filteredMentionUsers = useMemo(() => {
    if (!mentionQuery.trim()) return allUsers;
    return allUsers.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(mentionQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(mentionQuery.toLowerCase()),
    );
  }, [allUsers, mentionQuery]);

  const handleSelectMentionUser = (user: MentionUser) => {
    if (mentionMatchIndex === -1) return;

    const nameToInsert = user.name || user.email.split("@")[0];
    const beforeAt = commentText.slice(0, mentionMatchIndex);
    const afterAtQuery = commentText.slice(mentionMatchIndex + 1 + mentionQuery.length);

    const updatedText = `${beforeAt}@${nameToInsert} ${afterAtQuery}`;
    setCommentText(updatedText);
    setShowMentionSlider(false);
    setPickedMentions((prev) =>
      prev.some((u) => u.id === user.id) ? prev : [...prev, user],
    );

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = beforeAt.length + nameToInsert.length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [commentText]);

  const handleReplySelect = (id: string, name: string) => {
    setReplyingTo(id, name);
    setTimeout(() => {
      if (textareaRef.current) textareaRef.current.focus();
    }, 50);
  };

  const handleShareComment = (text: string) => {
    if (navigator.share) {
      navigator.share({ title: "Bridge Daily Comment", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Comment copied to clipboard!");
    }
  };

  const handleAvatarClick = async (author: Comment | Reply) => {
  const userId = author.authorUserId ?? "";
  if (!userId) return;

  // Get the selected user's complete profile from the users already fetched.
  const profileUser = allUsers.find((user) => user.id === userId);

  setSelectedProfile({
    id: userId,
    name: profileUser?.name || author.name,
    avatarUrl: profileUser?.avatar_url || author.avatarUrl,
    bannerUrl: profileUser?.banner_url || "",
    verificationTier:
      profileUser?.verification_tier ||
      author.authorVerificationTier,
    currentStreak:
      profileUser?.currentStreak ?? author.streakCount ?? 0,
    isFollowing: profileUser?.isFollowing ?? false,
  });

  try {
    const supabase = createSupabaseBrowserClient();
    const session = (await supabase?.auth.getSession())?.data?.session;

    const res = await fetch(`/api/users/${userId}/follow`, {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });

    if (!res.ok) return;

    const data = await res.json();

    setSelectedProfile((prev) =>
      prev?.id === userId
        ? { ...prev, isFollowing: !!data.isFollowing }
        : prev,
    );
  } catch (err) {
    console.error("Failed to load follow state:", err);
  }
};

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-xl mx-auto h-[75vh] max-h-162.5 bg-black border-t border-neutral-800 rounded-t-4xl z-50000 flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="w-full flex flex-col items-center pt-3 pb-2 shrink-0 relative border-b border-neutral-900">
              <div className="w-12 h-1 bg-neutral-700 rounded-full mb-3" />
              <h3 className="text-base font-bold text-white tracking-tight">Comments</h3>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-4 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close comments"
              >
                <IoClose className="w-6 h-6" />
              </button>
            </div>

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
                      currentUserId={currentUserId}
                      onLike={onLikeComment}
                      onEdit={onEditComment}
                      onDelete={onDeleteComment}
                      onShare={handleShareComment}
                      userTier={userTier}
                      onRequireUpgrade={() => setShowUpgradeModal(true)}
                      onReplySelect={handleReplySelect}
                      onAvatarClick={handleAvatarClick}
                      isSubmitting={isSubmitting}
                      activeReplyId={replyingToId}
                      activeReplyName={replyingToName}
                      isHighlighted={highlightedCommentId === comment.id}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

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
                    const userTierVal = getUserVerificationTier({
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
                            {userTierVal && (
                              <VerifiedBadge tier={userTierVal} name={user.name} email={user.email} size="sm" />
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
              <form
                onSubmit={(e) =>
                  onSubmitComment(
                    e,
                    pickedMentions
                      .filter((u) => commentText.includes(`@${u.name || u.email.split("@")[0]}`))
                      .map((u) => u.id),
                  )
                }
                className="flex items-end gap-3"
              >
                <CurrentUserAvatar avatarUrl={userAvatarUrl} initial={userInitial} name={userName} />

                <div className="relative flex-1 bg-black border border-neutral-800 rounded-3xl p-2.5 focus-within:border-neutral-700 transition-colors">
                  {replyingToName && (
                    <div className="float-left mr-2 mb-1">
                      <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-2 py-0.5 rounded-full select-none">
                        @{replyingToName}
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null, null)}
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
                    <IoSend className="w-4 h-4" />
                  ) : (
                    <Preloader className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Upgrade / Support Modal */}
          <AnimatePresence>
            {showUpgradeModal && (
              <div className="fixed inset-0 z-60000 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl relative"
                >
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(false)}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <IoClose className="size-5" />
                  </button>

                  <div className="size-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-primary">
                    <FaCrown className="size-6" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">Unlock Comment Actions</h3>
                  <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                    Editing and deleting comments requires a Reader, Supporter, Partner, Sponsor, Patron, or Visionary membership tier. Become a supporter today to unlock full community privileges!
                  </p>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpgradeModal(false);
                        window.location.href = "/support";
                      }}
                      className="w-full py-3 rounded-full bg-primary text-white font-bold text-xs hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-950/40"
                    >
                      Support Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(false)}
                      className="w-full py-2.5 rounded-full bg-neutral-900 text-neutral-300 font-bold text-xs hover:bg-neutral-800 transition-all cursor-pointer"
                    >
                      Maybe Later
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <UserProfilePopup
            isOpen={selectedProfile !== null}
            onClose={() => setSelectedProfile(null)}
            user={selectedProfile}
          />
        </>
      )}
    </AnimatePresence>
  );
};