"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface NotificationStats {
  allTime: number;
  today: number;
}

/** Total notifications the platform has sent, and how many today. */
export function NotificationVolumeCard() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const session = (await supabase?.auth.getSession())?.data?.session;
        if (!session?.access_token) {
          if (!cancelled) setError("Sign in as an admin to see notification totals.");
          return;
        }
        const res = await fetch("/api/admin/notification-stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load notification totals");
        if (!cancelled) setStats(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Could not load notification totals");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl bg-black border border-white/15 p-5 grid grid-cols-2 gap-4">
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
          Notifications Today
        </span>
        <span className="text-2xl font-black text-white">
          {stats ? stats.today.toLocaleString() : error ? "—" : "…"}
        </span>
      </div>
      <div>
        <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
          Notifications All Time
        </span>
        <span className="text-2xl font-black text-white">
          {stats ? stats.allTime.toLocaleString() : error ? "—" : "…"}
        </span>
      </div>
      {error && <p className="col-span-2 text-xs text-neutral-500">{error}</p>}
    </div>
  );
}
