"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFire } from "react-icons/fa";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    setIsAuthenticating(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-sm rounded-3xl bg-neutral-950/90 border border-white/10 backdrop-blur-2xl p-6 shadow-2xl z-10 text-center overflow-hidden space-y-5"
          >


            {/* Fire Icon */}
            <div className="mx-auto size-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-white shadow-lg shadow-red-600/5">
              <FaFire className="size-5" />
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Save Your Progress
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed px-2">
                Login with Google to save your information and manage your streaks from multiple devices.
              </p>
            </div>

            {/* Google OAuth Trigger */}
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={handleSignIn}
              className="w-full h-11 px-4 rounded-full border border-neutral-700 bg-white text-black text-xs font-bold hover:bg-neutral-200 active:scale-95 transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <FaGoogle className="size-3.5 text-neutral-700" />
              <span>{isAuthenticating ? "Connecting..." : "Continue with Google"}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}