"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const getAuthRedirectUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || "https://alexanderdbridge.com").replace(/\/$/, "");

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (loading) return <div className="size-11 animate-pulse rounded-full bg-white/5" />;
  if (!user) {
    return <button type="button" onClick={handleSignIn} className="h-11 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white">Continue with Google</button>;
  }

  return <button type="button" onClick={handleSignOut} className="size-11 overflow-hidden rounded-full border-2 border-red-600 bg-white/5 text-xs text-white" title="Sign out">
    {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="Your profile" className="size-full object-cover" /> : "You"}
  </button>;
}
