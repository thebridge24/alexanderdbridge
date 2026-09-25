/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaSignOutAlt, FaUser } from "react-icons/fa";
import { MdVerified } from "react-icons/md";

// Helper function to check if the user is verified by email
const isVerifiedUser = (email?: string): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  const VERIFIED_EMAILS = [
    "alexanderchrist203@gmail.com",
    "alexanderdbridge@gmail.com",
  ];

  return VERIFIED_EMAILS.includes(cleanEmail);
};

// Component to handle loading states, error fallbacks, and URL caching
function UserAvatar({
  avatarUrl,
  userId,
  className = "size-full",
}: {
  avatarUrl?: string;
  userId: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!avatarUrl || !userId) return;

    const storageMetaKey = `user_avatar_url_${userId}`;
    const storedUrl = localStorage.getItem(storageMetaKey);

    if (storedUrl === avatarUrl) {
      setSrc(storedUrl);
    } else {
      localStorage.setItem(storageMetaKey, avatarUrl);
      setSrc(avatarUrl);
    }
  }, [avatarUrl, userId]);

  // Fallback icon when loading, missing URL, or broken image
  if (!avatarUrl || hasError) {
    return (
      <div
        className={`rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-300 ${className}`}
      >
        <FaUser className="size-3.5" />
      </div>
    );
  }

  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-neutral-400 animate-pulse">
          <FaUser className="size-3.5 opacity-60" />
        </div>
      )}

      <img
        src={src || avatarUrl}
        alt="User Avatar"
        loading="eager"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`size-full object-cover rounded-full transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    setIsOpen(false);
  };

  if (loading) {
    return <div className="size-11 rounded-full bg-white/5 border border-neutral-800/80 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        className="flex items-center gap-2.5 h-11 px-4 rounded-full border border-neutral-800/80 bg-white/5 text-xs font-semibold text-neutral-200 backdrop-blur-md hover:border-neutral-600 hover:bg-neutral-800/80 hover:text-white active:scale-95 transition-all shadow-2xl cursor-pointer"
      >
        <FaGoogle className="size-3.5 text-neutral-400" />
        <span className="hidden sm:inline">Continue with Google</span>
        <span className="sm:hidden">Login</span>
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const fullName = user.user_metadata?.full_name ?? user.email;
  const verified = isVerifiedUser(user.email);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center size-11 rounded-full border-2 border-red-600 bg-white/5 backdrop-blur-md hover:border-red-700 hover:bg-neutral-800/80 active:scale-95 transition-all shadow-2xl cursor-pointer"
      >
        <UserAvatar avatarUrl={avatarUrl} userId={user.id} className="size-full" />
        
        {/* Bottom-right verified badge overlay */}
        {verified && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-neutral-950 rounded-full p-0.5 z-10 flex items-center justify-center">
            <MdVerified className="size-3.5 text-blue-500" />
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute right-0 mt-3 w-64 rounded-3xl bg-neutral-950/90 border border-neutral-800 backdrop-blur-2xl p-4 shadow-2xl z-50 text-left space-y-3"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-800/80">
              <div className="relative shrink-0">
                <UserAvatar avatarUrl={avatarUrl} userId={user.id} className="size-10" />
                {verified && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-neutral-950 rounded-full p-0.5 z-10 flex items-center justify-center">
                    <MdVerified className="size-3 text-blue-500" />
                  </div>
                )}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{fullName}</span>
                  {verified && <MdVerified className="size-3.5 text-blue-500 shrink-0" />}
                </div>
                <span className="text-[11px] text-neutral-500 truncate">{user.email}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer border border-red-500/20"
            >
              <FaSignOutAlt className="size-3.5" /> Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}