"use client";

import React, { useEffect, useState } from "react";
import { SurveyEngine } from "./survey/SurveyEngine";
import { devotionalSurveyConfig } from "../config/devotionalSurvey";

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
    // Expose payload clean for backend connection
    console.log("Survey Answers Payload:", answers);

    /*
    Example backend call:
    await fetch('/api/surveys/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        surveyId: devotionalSurveyConfig.id,
        answers,
      }),
    });
    */

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
