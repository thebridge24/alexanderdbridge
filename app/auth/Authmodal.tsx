"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getAuthRedirectUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }

  return (process.env.NEXT_PUBLIC_SITE_URL || "https://alexanderdbridge.com").replace(/\/$/, "");
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsAuthenticating(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getAuthRedirectUrl() },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/10 bg-neutral-950 p-6 text-center shadow-2xl">
        <h3 className="text-base font-bold text-white">Create your account</h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-400">
          Sign in with Google to read devotionals, save your streak, comment, and enable notifications.
        </p>
        <button
          type="button"
          disabled={isAuthenticating}
          onClick={handleSignIn}
          className="mt-5 h-11 w-full rounded-full border border-neutral-700 bg-white px-4 text-xs font-bold text-black transition-all hover:bg-neutral-200 disabled:opacity-50"
        >
          {isAuthenticating ? "Connecting..." : "Continue with Google"}
        </button>
        <button type="button" onClick={onClose} className="mt-3 text-xs text-neutral-500 hover:text-white">
          Close
        </button>
      </div>
    </div>
  );
}
