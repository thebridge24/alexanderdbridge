"use client";

import React, { useState } from "react";
import { SurveyEngine } from "../components/survey/SurveyEngine";
import { devotionalSurveyConfig } from "../config/devotionalSurvey";

export default function DevotionalPage() {
  const [isSurveyOpen, setIsSurveyOpen] = useState<boolean>(true);

  const handleSurveySubmit = async (answers: Record<string, any>) => {
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
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <button
        onClick={() => setIsSurveyOpen(true)}
        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-all"
      >
        Open Devotional Survey
      </button>

      <SurveyEngine
        config={devotionalSurveyConfig}
        isOpen={isSurveyOpen}
        onClose={() => setIsSurveyOpen(false)}
        onSubmit={handleSurveySubmit}
      />
    </main>
  );
}
