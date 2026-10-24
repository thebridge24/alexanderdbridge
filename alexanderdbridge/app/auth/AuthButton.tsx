/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/utils/auth";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaSignOutAlt, FaUser } from "react-icons/fa";
import { MdAlarm } from "react-icons/md";
import ReminderTimePicker from "@/app/components/ReminderTimePicker";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

// Component to handle loading states, error fallbacks, and URL caching
export function UserAvatar({
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
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState<string | undefined>(
    undefined,
  );
  const [tier, setTier] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;
  const supabase = createSupabaseBrowserClient();

  async function loadVerification() {
    setTier(null);

    if (!user || !supabase) return;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) return;

      const response = await fetch("/api/users/verification", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      if (!cancelled) {
        setTier(data.verification_tier ?? null);
      }
    } catch (error) {
      console.error("Failed to load verification badge:", error);
    }
  }

  loadVerification();

  return () => {
    cancelled = true;
  };
}, [user]);
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // getSession reads the persisted session locally (refreshing if needed), so a flaky
    // network request can't make a signed-in user look signed out
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await signInWithGoogle(supabase);
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    setIsOpen(false);
  };

  // Load the user's saved reminder time so the picker opens on it, then show the picker
  const handleOpenReminder = async () => {
    setIsOpen(false);
    try {
      const supabase = createSupabaseBrowserClient();
      const token = (await supabase?.auth.getSession())?.data?.session
        ?.access_token;
      if (token) {
        const res = await fetch("/api/notifications/preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.preferences?.reminder_time)
            setReminderTime(json.preferences.reminder_time);
        }
      }
    } catch {
      // Fall back to the picker's default time
    }
    setIsReminderOpen(true);
  };

  if (loading) {
    return (
      <div className="size-11 rounded-full bg-white/5 border border-neutral-800/80 animate-pulse" />
    );
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center size-11 rounded-full border-2 border-red-600 bg-white/5 backdrop-blur-md hover:border-red-700 hover:bg-neutral-800/80 active:scale-95 transition-all shadow-2xl cursor-pointer"
      >
        <UserAvatar
          avatarUrl={avatarUrl}
          userId={user.id}
          className="size-full"
        />

        {/* Bottom-right verified badge overlay */}
        {tier && (
          <div className="absolute -bottom-0.5 -right-0.5 bg-neutral-950 rounded-full p-0.5 z-10 flex items-center justify-center">
            <VerifiedBadge tier={tier} name={fullName} size="xs" />
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
                <UserAvatar
                  avatarUrl={avatarUrl}
                  userId={user.id}
                  className="size-10"
                />
               
              </div>
              <div className="flex flex-col truncate min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {fullName}
                  </span>
                  {tier && <VerifiedBadge tier={tier} size="xs" />}
                </div>
                <span className="text-[11px] text-neutral-500 truncate">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenReminder}
              className="w-full py-2.5 px-4 rounded-full text-xs font-semibold bg-white/5 text-neutral-200 hover:bg-white/10 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer border border-neutral-800"
            >
              <MdAlarm className="size-4" /> Reminder Time
            </button>

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

      {/* Rendered outside the blurred dropdown so its fixed overlay covers the whole screen */}
      <ReminderTimePicker
        key={reminderTime ?? "default"}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        userId={user.id}
        initialTime={reminderTime}
        onSuccess={(saved) => setReminderTime(saved)}
      />
    </div>
  );
}
