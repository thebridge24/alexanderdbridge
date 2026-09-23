"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) {
        setUser(data.user);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="h-10 w-10 rounded-full bg-white/5" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        className="rounded-full border border-neutral-800 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition-colors hover:border-neutral-600 hover:text-white"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex max-w-40 items-center gap-2 rounded-full border border-neutral-800 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-300 backdrop-blur-md transition-colors hover:border-neutral-600 hover:text-white"
      title="Sign out"
    >
      <span className="truncate">{user.user_metadata?.full_name ?? user.email}</span>
    </button>
  );
}