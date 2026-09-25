/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { storeUserName } from "@/lib/session";
import type { User } from "@supabase/supabase-js";

export default function DevotionalRedirectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Authenticating...");

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    // Compute today's date format (YYYY-MM-DD) dynamically
    const getTodayString = () => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(today.getDate()).padStart(2, "0")}`;
    };

    const performRedirect = () => {
      const todayString = getTodayString();
      router.replace(`/devotional/${todayString}`);
    };

    if (!supabase) {
      performRedirect();
      return;
    }

    // 1. Initial Auth Check (Catches existing session or parsed OAuth tokens)
    supabase.auth.getUser().then(({ data, error }) => {
      if (!isMounted) return;

      if (data?.user) {
        setUser(data.user);
        const name =
          data.user.user_metadata?.full_name || data.user.user_metadata?.name;
        if (name) {
          storeUserName(name);
        }
        setStatusMessage("Authenticated. Loading devotional...");
      } else if (error) {
        console.error("Auth check error:", error.message);
      }

      performRedirect();
    });

    // 2. Auth State Change Listener (Catches OAuth sign-in events during redirection)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name;
        if (name) {
          storeUserName(name);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="w-full min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Minimalist spinner */}
        <div className="w-10 h-10 border-2 border-neutral-800 border-t-white rounded-full animate-spin" />

        <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase animate-pulse">
          {statusMessage}
        </p>
      </div>
    </main>
  );
}
