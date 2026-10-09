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
} from "lucide-react";
import { getBroadcastEmailHtml } from "@/lib/email/templates/broadcast";

interface SurveyBroadcasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalRespondents: number;
}

export default function SurveyBroadcasterModal({
  isOpen,
  onClose,
  totalRespondents,
}: SurveyBroadcasterModalProps) {
  const [subject, setSubject] = useState(
    "A Special Word from The Bridge Devotional",
  );
  const [target, setTarget] = useState<
    "survey_respondents" | "willing" | "all_users"
  >("survey_respondents");
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "editor" | "email_preview" | "push_preview"
  >("editor");

  // ContentEditable Div text content
  const [rawText, setRawText] = useState(
    "Thank you for sharing your feedback on The Bridge Daily Devotional!\n\nWe are excited to build a deeper, more enriching devotional experience for you every single day.\n\nStay tuned as we continue to launch new spiritual engagement features.",
  );

  const [isSending, setIsSending] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize the editor only when it becomes visible.
  // Do not bind rawText as JSX children — React would rewrite the editable DOM
  // on every keystroke and move the caret.
  useEffect(() => {
    if (isOpen && activeTab === "editor" && editorRef.current) {
      editorRef.current.innerText = rawText;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // Parse raw text into distinct paragraph strings
  const paragraphs = rawText
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const handleTextChange = (e: React.FormEvent<HTMLDivElement>) => {
    setRawText(e.currentTarget.innerText);
  };

  const handleBroadcast = async () => {
    if (!subject.trim()) {
      setResultMessage({ type: "error", text: "Please enter a message subject/title." });
      return;
    }
    if (paragraphs.length === 0) {
      setResultMessage({ type: "error", text: "Please enter at least one paragraph of text." });
      return;
    }
    if (!sendEmail && !sendPush) {
      setResultMessage({ type: "error", text: "Please select at least one channel (Email or Push)." });
      return;
    }

    setIsSending(true);
    setResultMessage(null);

    try {
      const channels: string[] = [];
      if (sendEmail) channels.push("email");
      if (sendPush) channels.push("push");

      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, paragraphs, target, channels, ctaText: "Open Devotional", ctaUrl: "/devotional" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Broadcast failed");

      setResultMessage({
        type: "success",
        text: `Broadcast sent! Targeted ${data.recipientsTargeted} recipients (${data.emailsSent} emails, ${data.pushSent} push).`,
      });
    } catch (err: any) {
      setResultMessage({ type: "error", text: err.message || "Failed to deliver broadcast." });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const emailHtmlPreview = getBroadcastEmailHtml({
    subject,
    paragraphs: paragraphs.length > 0 ? paragraphs : ["Your paragraph content will appear here..."],
    recipientName: "Believer",
    ctaText: "Open Daily Devotional",
    ctaUrl: "https://alexanderdbridge.com/devotional",
  });

  return (
    <AnimatePresence>
      {/* Full-screen overlay — slides up from bottom on mobile, centred on sm+ */}
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          /* Bottom-sheet on mobile, floating card on sm+ */
          className="w-full sm:max-w-3xl bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
        >
          {/* ── Header ── */}
          <div className="px-4 py-4 sm:px-6 sm:py-5 bg-gradient-to-b from-neutral-900 to-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 sm:size-11 rounded-xl sm:rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-500 shadow-inner shrink-0">
                <Send className="size-4 sm:size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
                  Survey Broadcast &amp; Communications
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                  Send emails and push notifications to respondents
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer shrink-0"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* ── Tab Navigation — wraps on narrow phones ── */}
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

          {/* ── Scrollable Body ── */}
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

                {/* ContentEditable Paragraph Div */}
                <div className="relative rounded-2xl bg-black border border-neutral-800 focus-within:border-red-600/80 transition-all p-4 shadow-inner">
                  <div
                    ref={editorRef}
                    contentEditable={true}
                    onInput={handleTextChange}
                    suppressContentEditableWarning={true}
                    className="min-h-[140px] sm:min-h-[160px] max-h-[240px] sm:max-h-[300px] overflow-y-auto text-sm text-neutral-200 leading-relaxed focus:outline-none whitespace-pre-wrap font-sans"
                  />
                </div>

                <p className="text-[11px] text-neutral-500 italic">
                  * Press Enter twice to create a new paragraph block. Each paragraph renders cleanly in email and push.
                </p>

                {/* Recipients & Channels — stacks on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Target Select */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4">
                    <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="size-3.5 text-red-500 shrink-0" />
                      Target Recipients
                    </label>
                    <select
                      value={target}
                      onChange={(e: any) => setTarget(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600 font-medium cursor-pointer"
                    >
                      <option value="survey_respondents">
                        Survey Respondents ({totalRespondents})
                      </option>
                      <option value="willing">Willing Members (Yes / Maybe)</option>
                      <option value="all_users">All Registered Users</option>
                    </select>
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
                  <span>Live Rendered Premium Email Template:</span>
                  <span className="font-mono text-emerald-400 text-[11px] shrink-0">Resend HTML</span>
                </div>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-2 overflow-hidden">
                  <iframe
                    title="Email Preview"
                    srcDoc={emailHtmlPreview}
                    className="w-full min-h-[340px] sm:min-h-[420px] rounded-xl bg-black border-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PUSH PREVIEW */}
            {activeTab === "push_preview" && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-neutral-400">
                  How this notification will appear on mobile phones and desktop browsers:
                </p>

                <div className="max-w-sm mx-auto bg-neutral-950/95 border border-red-500/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-left">
                  <div className="size-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                    <Bell className="size-5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold text-white truncate">
                        {subject || "Notification Title"}
                      </h5>
                      <span className="text-[10px] text-neutral-400 shrink-0">Just now</span>
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 line-clamp-3 leading-relaxed">
                      {paragraphs[0] || "Your broadcast message will display here..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Result / Status Banner */}
            {resultMessage && (
              <div
                className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 ${
                  resultMessage.type === "success"
                    ? "bg-emerald-950/80 border border-emerald-800 text-emerald-300"
                    : "bg-red-950/80 border border-red-800 text-red-300"
                }`}
              >
                <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                <span>{resultMessage.text}</span>
              </div>
            )}
          </div>

          {/* ── Footer Actions — stacks vertically on mobile ── */}
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
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 active:scale-95 disabled:opacity-50 shadow-xl shadow-red-900/40 transition-all cursor-pointer"
            >
              <Send className="size-3.5 shrink-0" />
              {isSending ? "Broadcasting..." : "Broadcast Message"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}