/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Mail,
  Bell,
  Edit3,
  CheckCircle2,
  Users,
  Search,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { getBroadcastEmailHtml } from "@/lib/email/templates/broadcast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Preloader from "./ui/Preloader";

export interface BroadcastRecipientCategory {
  id: string;
  label: string;
  count?: number;
  emails?: string[];
}

interface SurveyBroadcasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dynamic recipient categories passed from parent components */
  recipientCategories?: BroadcastRecipientCategory[];
  defaultCategory?: string;
}

interface AppUser {
  id: string;
  email: string;
  name?: string;
}

interface FailedEmailItem {
  id: string;
  email: string;
  errorReason: string;
  failedAt: string;
}

export default function SurveyBroadcasterModal({
  isOpen,
  onClose,
  recipientCategories = [
    { id: "all_users", label: "All Registered Users" },
    { id: "survey_respondents", label: "Survey Respondents" },
  ],
  defaultCategory = "all_users",
}: SurveyBroadcasterModalProps) {
  const [subject, setSubject] = useState(
    "A Special Word from The Bridge Devotional",
  );
  const [target, setTarget] = useState<string>(defaultCategory);

  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "editor" | "email_preview" | "push_preview"
  >("editor");

  // User search & selection state for individual targeting
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<AppUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Failed Emails Sub-Modal State
  const [isFailedMailsOpen, setIsFailedMailsOpen] = useState(false);
  const [failedMails, setFailedMails] = useState<FailedEmailItem[]>([]);
  const [isResending, setIsResending] = useState<string | null>(null);

  // ContentEditable Div text content
  const [rawText, setRawText] = useState(
    "Thank you for being an active part of The Bridge Daily Devotional community!\n\nWe are excited to build a deeper, more enriching devotional experience for you every single day.",
  );

  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [failedEmails, setFailedEmails] = useState<
    { email: string; error: string; statusCode?: number; timestamp?: string }[]
  >([]);
  const [isCopied, setIsCopied] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  const handleCopyFailed = () => {
    if (failedEmails.length === 0) return;
    const text = failedEmails.map((f) => `${f.email} - ${f.error}`).join("\n");
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Fetch all registered users for individual targeting & failed logs on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchAppData() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json.users) {
          const mapped: AppUser[] = json.users.map((u: any) => ({
            id: u.id || u.email,
            email: u.email,
            name: u.name || u.full_name || u.email.split("@")[0],
          }));
          setAllUsers(mapped);
        }

        // Fetch mock or real failed email logs if endpoint exists
        const failRes = await fetch("/api/admin/broadcast/failed", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null);

        if (failRes && failRes.ok) {
          const failJson = await failRes.json();
          if (!cancelled && failJson.failed) {
            setFailedMails(failJson.failed);
          }
        }
      } catch (err) {
        console.error("Failed to load users for broadcaster:", err);
      }
    }

    if (isOpen) {
      fetchAppData();
      setTarget(defaultCategory);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, defaultCategory]);

  useEffect(() => {
    if (!isOpen || activeTab !== "editor" || !editorRef.current) {
      return;
    }

    if (editorRef.current.innerText !== rawText) {
      editorRef.current.innerText = rawText;
    }
  }, [isOpen, activeTab]);

  const paragraphs = rawText
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    setRawText(e.currentTarget.innerText);
  };

  const handleSelectUser = (user: AppUser) => {
    if (!selectedUsers.some((u) => u.email === user.email)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery("");
    setIsUserDropdownOpen(false);
  };

  const handleRemoveUser = (email: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.email !== email));
  };

  const filteredUsersList = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())),
  );

  const handleBroadcast = async () => {
    if (!subject.trim()) {
      setResultMessage({
        type: "error",
        text: "Please enter a message subject/title.",
      });
      return;
    }
    if (paragraphs.length === 0) {
      setResultMessage({
        type: "error",
        text: "Please enter at least one paragraph of text.",
      });
      return;
    }
    if (!sendEmail && !sendPush) {
      setResultMessage({
        type: "error",
        text: "Please select at least one channel (Email or Push).",
      });
      return;
    }
    if (target === "selected_users" && selectedUsers.length === 0) {
      setResultMessage({
        type: "error",
        text: "Please select at least one user to broadcast to.",
      });
      return;
    }

    setIsSending(true);
    setResultMessage(null);
    setFailedEmails([]);

    try {
      const channels: string[] = [];
      if (sendEmail) channels.push("email");
      if (sendPush) channels.push("push");

      const payload: any = {
        subject,
        paragraphs,
        target,
        channels,
        ctaText: "Open Devotional",
        ctaUrl: "/devotional",
      };

      if (target === "selected_users") {
        payload.recipientEmails = selectedUsers.map((u) => u.email);
      }

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      if (
        data.failedDetails &&
        Array.isArray(data.failedDetails) &&
        data.failedDetails.length > 0
      ) {
        setFailedEmails(data.failedDetails);
        const newFailedItems: FailedEmailItem[] = data.failedDetails.map(
          (f: any, idx: number) => ({
            id: `broadcast-${Date.now()}-${idx}`,
            email: f.email,
            errorReason: f.error || "Delivery failure",
            failedAt: f.timestamp || new Date().toISOString(),
          }),
        );
        setFailedMails((prev) => [...newFailedItems, ...prev]);
      }

      if (data.emailsFailed > 0 || data.emailError) {
        setResultMessage({
          type: data.emailsSent > 0 ? "success" : "error",
          text: `Targeted ${data.recipientsTargeted} recipients (${data.emailsSent} emails delivered, ${data.emailsFailed || 0} failed, ${data.pushSent} push).`,
        });
      } else {
        setResultMessage({
          type: "success",
          text: `Broadcast delivered! Targeted ${data.recipientsTargeted} recipients (${data.emailsSent} emails, ${data.pushSent} push). All delivered successfully.`,
        });
      }
    } catch (err: any) {
      setResultMessage({
        type: "error",
        text: err.message || "Failed to deliver broadcast.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResendFailedEmail = async (id: string, email: string) => {
    setIsResending(id);
    try {
      const res = await fetch("/api/admin/broadcast/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: id, email }),
      });
      if (res.ok) {
        setFailedMails((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Resend failed:", err);
    } finally {
      setIsResending(null);
    }
  };

  if (!isOpen) return null;

  const emailHtmlPreview = getBroadcastEmailHtml({
    subject,
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : ["Your paragraph content will appear here..."],
    recipientName: "Believer",
    ctaText: "Open Daily Devotional",
    ctaUrl: "https://alexanderdbridge.com/devotional",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="w-full sm:max-w-3xl bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 bg-linear-to-b from-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 sm:size-11 rounded-xl sm:rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-primary shadow-inner shrink-0">
                <Send className="size-4 sm:size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
                  Targeted Broadcast &amp; Communications
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                  Send emails and push notifications to dynamic recipient tiers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFailedMailsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-medium transition-all cursor-pointer"
              >
                <AlertTriangle className="size-3.5 text-amber-500" />
                <span>Failed Mails</span>
                {failedMails.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px]">
                    {failedMails.length}
                  </span>
                )}
              </button>

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-neutral-900/50 border-b border-neutral-800/80 shrink-0 text-xs font-medium">
            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "editor"
                  ? "bg-red-600 text-white font-bold shadow-md shadow-red-900/40"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Edit3 className="size-3.5 shrink-0" />
              Editor
            </button>

            <button
              onClick={() => setActiveTab("email_preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "email_preview"
                  ? "bg-red-600 text-white font-bold shadow-md shadow-red-900/40"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Mail className="size-3.5 shrink-0" />
              Email Preview
            </button>

            <button
              onClick={() => setActiveTab("push_preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "push_preview"
                  ? "bg-red-600 text-white font-bold shadow-md shadow-red-900/40"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Bell className="size-3.5 shrink-0" />
              Push Preview
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="px-4 sm:px-6 py-5 overflow-y-auto space-y-5 flex-1 text-left">
            {/* Subject Line */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Subject / Notification Title
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. A Special Announcement from The Bridge"
                className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 transition-colors font-medium"
              />
            </div>

            {/* TAB 1: PARAGRAPH EDITOR */}
            {activeTab === "editor" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Message Body
                  </label>
                  <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                    {paragraphs.length} Para{paragraphs.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="relative rounded-2xl bg-black border border-neutral-800 focus-within:border-red-600/80 transition-all p-4 shadow-inner">
                  <div
                    ref={editorRef}
                    contentEditable={true}
                    onInput={handleTextChange}
                    suppressContentEditableWarning={true}
                    className="min-h-35 sm:min-h-40 max-h-60 sm:max-h-75 overflow-y-auto text-sm text-neutral-200 leading-relaxed focus:outline-none whitespace-pre-wrap font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Dynamic Target Select */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
                    <label className=" text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="size-3.5 text-primary shrink-0" />
                      Target Recipients
                    </label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 font-medium cursor-pointer"
                    >
                      {recipientCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}{" "}
                          {cat.count !== undefined ? `(${cat.count})` : ""}
                        </option>
                      ))}
                      <option value="selected_users">
                        Select Specific Individuals
                      </option>
                    </select>

                    {/* Individual User Search & Selection Toggle Tags */}
                    {target === "selected_users" && (
                      <div className="space-y-2 pt-2 border-t border-neutral-800">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500" />
                          <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => {
                              setUserSearchQuery(e.target.value);
                              setIsUserDropdownOpen(true);
                            }}
                            onFocus={() => setIsUserDropdownOpen(true)}
                            placeholder="Search user name or email..."
                            className="w-full bg-black border border-neutral-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-600"
                          />

                          {isUserDropdownOpen &&
                            userSearchQuery.trim().length > 0 && (
                              <div className="absolute z-30 mt-1 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                                {filteredUsersList.length > 0 ? (
                                  filteredUsersList.map((u) => (
                                    <div
                                      key={u.id}
                                      onClick={() => handleSelectUser(u)}
                                      className="px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800 cursor-pointer flex flex-col border-b border-neutral-800/50 last:border-none"
                                    >
                                      <span className="font-semibold text-white">
                                        {u.name}
                                      </span>
                                      <span className="text-[10px] text-neutral-400 font-mono">
                                        {u.email}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-xs text-neutral-500">
                                    No users found
                                  </div>
                                )}
                              </div>
                            )}
                        </div>

                        {selectedUsers.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
                            {selectedUsers.map((u) => (
                              <span
                                key={u.email}
                                className="inline-flex items-center gap-1.5 bg-neutral-800 border border-neutral-700 text-white text-[11px] px-2.5 py-1 rounded-full font-medium"
                              >
                                <span className="truncate max-w-30">
                                  {u.name || u.email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(u.email)}
                                  className="text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                                  aria-label={`Remove ${u.email}`}
                                >
                                  <X className="size-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Channel Toggles */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-3">
                      Delivery Channels
                    </label>
                    <div className="flex flex-col gap-3">
                      <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                          className="accent-red-600 size-4 rounded cursor-pointer"
                        />
                        <Mail className="size-3.5 text-red-400 shrink-0" />
                        Send Email
                      </label>
                      <label className="flex items-center gap-2 text-xs text-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sendPush}
                          onChange={(e) => setSendPush(e.target.checked)}
                          className="accent-red-600 size-4 rounded cursor-pointer"
                        />
                        <Bell className="size-3.5 text-red-400 shrink-0" />
                        Push Notification
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMAIL PREVIEW */}
            {activeTab === "email_preview" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 gap-2">
                  <span>Email Template:</span>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-2 overflow-hidden">
                  <iframe
                    title="Email Preview"
                    srcDoc={emailHtmlPreview}
                    className="w-full min-h-85 sm:min-h-105 rounded-xl bg-black border-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PUSH PREVIEW */}
            {activeTab === "push_preview" && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-neutral-400">
                  How this notification will appear on mobile phones and desktop
                  browsers:
                </p>

                <div className="max-w-sm mx-auto bg-neutral-950/95 border border-primary/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-left">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-primary mt-0.5">
                    <Bell className="size-5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-white truncate">
                        {subject || "Notification Title"}
                      </h5>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        Just now
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 line-clamp-3 leading-relaxed">
                      {paragraphs[0] ||
                        "Your broadcast message will display here..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {resultMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
                  resultMessage.type === "success"
                    ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                    : "bg-red-950/80 border border-red-800 text-red-300"
                }`}
              >
                {resultMessage.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-red-400" />
                )}
                <span>{resultMessage.text}</span>
              </div>
            )}

            {/* Detailed Failed Emails Breakdown */}
            {failedEmails.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="size-4 shrink-0 text-primary" />
                    <span>Failed Deliveries ({failedEmails.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyFailed}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy Failed List</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {failedEmails.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/60 border border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                    >
                      <span className="font-mono text-neutral-200 font-medium truncate max-w-xs sm:max-w-sm">
                        {item.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-5 py-4 bg-neutral-900/80 border-t border-neutral-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleBroadcast}
              disabled={isSending}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-primary active:scale-95 disabled:opacity-50 shadow-xl shadow-red-900/40 transition-all cursor-pointer"
            >
              <Send className="size-3.5 shrink-0" />
              {isSending ? <Preloader /> : "Broadcast Message"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Failed Mails Sub-Modal ── */}
      {isFailedMailsOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="px-5 py-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-5 text-amber-500" />
                <h4 className="text-sm font-bold text-white">
                  Failed Email Deliveries
                </h4>
              </div>
              <button
                onClick={() => setIsFailedMailsOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-left">
              {failedMails.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No failed emails recorded. All broadcasts delivered
                  successfully!
                </div>
              ) : (
                failedMails.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white truncate block">
                        {item.email}
                      </span>
                      <span className="text-[10px] text-red-400 font-mono block truncate">
                        {item.errorReason}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isResending === item.id}
                      onClick={() =>
                        handleResendFailedEmail(item.id, item.email)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-primary disabled:opacity-50 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-md transition-all"
                    >
                      <RotateCcw
                        className={`size-3 ${isResending === item.id ? "animate-spin" : ""}`}
                      />
                      <span>
                        {isResending === item.id ? "Resending..." : "Resend"}
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
