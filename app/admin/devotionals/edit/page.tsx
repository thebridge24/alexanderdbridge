"use client";

import { Suspense } from "react";
import DevotionalEditorContent from "./DevotionalEditorContent"; // Or paste your editor code in a separate component
import Preloader from "@/app/components/ui/Preloader";

export default function DevotionalEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center text-xs font-mono text-neutral-500">
           <Preloader />
        </div>
      }
    >
      <DevotionalEditorContent />
    </Suspense>
  );
}
