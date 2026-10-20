"use client";

import { Suspense } from "react";
import DevotionalEditorContent from "./DevotionalEditorContent"; // Or paste your editor code in a separate component

export default function DevotionalEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center text-xs font-mono text-neutral-500">
          Loading editor interface...
        </div>
      }
    >
      <DevotionalEditorContent />
    </Suspense>
  );
}
