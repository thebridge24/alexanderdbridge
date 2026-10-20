"use client";

import { AppleTypewriterText } from "@/app/components/ui/AppleTypewriterText";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { FiCalendar } from "react-icons/fi";

export function WelcomeHeader() {
  const [greeting, setGreeting] = useState("Hello");
  const [formattedDate, setFormattedDate] = useState("");
  const [adminName, setAdminName] = useState("Alexander D Bridge");

  // Fetch real session details if available to ensure accurate profile display
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user) {
        const metadata = user.user_metadata;
        if (metadata?.full_name || metadata?.name) {
          setAdminName(metadata.full_name || metadata.name);
        }
      }
    });
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) {
        setGreeting("Good Morning");
      } else if (hour < 18) {
        setGreeting("Good Afternoon");
      } else {
        setGreeting("Good Evening");
      }

      setFormattedDate(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Sync every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4  relative overflow-hidden">
      {/* Background Red Ambient Soft Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="space-y-1 relative z-10">
        <AppleTypewriterText text={greeting + " , " + adminName}
        className="text-lg xs:text-2xl sm:text-3xl font-black tracking-tight text-white"
        maxLength={25}
        />
        <p className="text-xs sm:text-sm text-neutral-400 font-medium">
          Here is what is happening across your devotional app today.
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-semibold text-neutral-300 w-fit shrink-0 relative z-10">
        <FiCalendar className="text-red-500 size-4" />
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
