/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { SurveyEngine } from "./survey/SurveyEngine";
import { devotionalSurveyConfig } from "../config/devotionalSurvey";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSessionId, getStoredUserName } from "@/lib/session";

const SHOW_AFTER_MS = 30_000;
const STORAGE_KEY = `survey-done:${devotionalSurveyConfig.id}`;

function alreadyDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export default function Survey() {
  const [isOpen, setIsOpen] = useState(false);

  // Show the survey 30s after the devotional view mounts (once per user).
  useEffect(() => {
    if (alreadyDone()) return;
    const timer = setTimeout(() => setIsOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (answers: Record<string, any>) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const supabase = createSupabaseBrowserClient();
      const session = (await supabase?.auth.getSession())?.data?.session;
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch {}

    const res = await fetch("/api/surveys/submit", {
      method: "POST",
      headers,
      body: JSON.stringify({
        surveyId: devotionalSurveyConfig.id,
        answers,
        sessionId: getSessionId(),
        userName: getStoredUserName() || undefined,
      }),
    });
    if (!res.ok) throw new Error("Survey submission failed");

    markDone();
  };

  return (
    <SurveyEngine
      config={devotionalSurveyConfig}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={handleSubmit}
    />
  );
}
