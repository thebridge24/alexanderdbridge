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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 1. Verify user session login status on mount
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        setIsLoggedIn(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user?.id));
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Show the survey 30s after mount ONLY if logged in and not already completed
  useEffect(() => {
    if (!isLoggedIn || alreadyDone()) return;
    const timer = setTimeout(() => setIsOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [isLoggedIn]);

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

  // Do not render anything if the user is not logged in
  if (!isLoggedIn) return null;

  return (
    <SurveyEngine
      config={devotionalSurveyConfig}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onSubmit={handleSubmit}
    />
  );
}