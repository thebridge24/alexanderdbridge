/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DevotionalRedirectPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Authenticating...");

  useEffect(() => {
    let isMounted = true;

    async function handleAuthAndRedirect() {
      const supabase = createSupabaseBrowserClient();

      if (supabase) {
        // Handle OAuth callback token parsing or session verification
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            if (isMounted) setStatusMessage("Loading today's devotional...");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }

      // Compute today's date in YYYY-MM-DD format based on local time
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      // Redirect immediately to today's date path
      router.replace(`/devotional/${todayString}`);
    }

    handleAuthAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="w-full min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Apple-style minimalist loading ring */}
        <div className="w-10 h-10 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />
        
        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase animate-pulse">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
