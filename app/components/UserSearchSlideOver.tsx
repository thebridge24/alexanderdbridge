
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

// DATA
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaSearch, FaTimes, FaArrowLeft } from "react-icons/fa";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Preloader from "./ui/Preloader";
import { ChevronLeft, Search } from "lucide-react";

interface SearchUser {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  followersCount: string;
  isFollowing: boolean;
  verificationTier?: string | null;
}

interface UserSearchSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
}

const listContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.03,
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ACCESS TOKEN
async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseBrowserClient();
  const session = (await supabase?.auth.getSession())?.data?.session;

  return session?.access_token ?? null;
}

// LOGIC
export function UserSearchSlideOver({
  isOpen,
  onClose,
}: UserSearchSlideOverProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFollowId, setLoadingFollowId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Load users when the panel opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function loadUsers() {
      setIsLoading(true);
      setError("");

      try {
        const token = await getAccessToken();

        if (!token) {
          throw new Error("Please sign in to discover users.");
        }

        const res = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Unable to load users.");
        }

        if (!cancelled) {
          const mappedUsers: SearchUser[] = (data.users ?? []).map(
            (user: any) => ({
              id: user.id,
              name: user.name || "Bridge Daily User",
              handle:
                user.handle ||
                user.email?.split("@")[0] ||
                "",
              avatarUrl: user.avatar_url || user.avatarUrl || undefined,
              followersCount: String(user.followersCount ?? 0),
              isFollowing: Boolean(user.isFollowing),
              verificationTier:
                user.verification_tier ??
                user.verificationTier ??
                null,
            }),
          );

          setUsers(mappedUsers);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
          setUsers([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Close with Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Search by name or handle
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.handle.toLowerCase().includes(query),
    );
  }, [users, searchQuery]);

  // Follow / Unfollow
  const toggleFollow = async (userId: string) => {
    if (loadingFollowId) return;

    const selectedUser = users.find((user) => user.id === userId);
    if (!selectedUser) return;

    const previousFollowingState = selectedUser.isFollowing;

    setLoadingFollowId(userId);

    // Optimistic update
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, isFollowing: !previousFollowingState }
          : user,
      ),
    );

    try {
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Please sign in to follow people.");
      }

      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update follow.");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isFollowing: Boolean(data.isFollowing) }
            : user,
        ),
      );
    } catch (err: any) {
      // Roll back if the request fails
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, isFollowing: previousFollowingState }
            : user,
        ),
      );

      alert(err.message || "Failed to update follow.");
    } finally {
      setLoadingFollowId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-over panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 32,
            }}
            className="fixed inset-y-0 right-0 z-101 w-full max-w-md bg-black border-l border-neutral-800 shadow-2xl flex flex-col"
          >
            {/* Search Header */}
            <header className="shrink-0 px-4 pt-5 pb-4 border-b border-neutral-900 bg-black/95">
              
              <div className="flex items-center gap-2 mb-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="size-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  aria-label="Close search"
                >
                  <ChevronLeft size={20} />
                </button>
 {/* Search Input */}
              <div className="relative flex items-center w-full">
                <Search className="absolute left-1 text-neutral-500 size-3.5 pointer-events-none" />

                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or username..."
                  className="w-full bg-black border-b border-neutral-800 py-3 pl-7 pr-10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 text-neutral-500 hover:text-white"
                    aria-label="Clear search"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
                <div className="flex-1">

               
              </div>

             </div>

              <p className="text-[10px] text-neutral-600 font-mono mt-3">
                {searchQuery
                  ? `${filteredUsers.length} matching users`
                  : `${users.length} people to discover`}
              </p>
            </header>

            {/* Results */}
            <main className="flex-1 overflow-y-auto px-3 divide-y divide-neutral-900/80">
              {isLoading ? (
                <div className="py-16 text-center">
                 <Preloader />
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Finding people...
                  </p>
                </div>
              ) : error ? (
                <div className="py-20 text-center px-6">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <div className="size-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto">
                    <Search className="text-neutral-600" />
                  </div>
                  <p className="text-xs font-bold text-neutral-300">
                    {searchQuery ? "No users found" : "No users available"}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    {searchQuery
                      ? "Try searching with another name or username."
                      : "There are no people to display right now."}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={listContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-neutral-900/80"
                >
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user.id}
                      variants={listItemVariants}
                      className="flex items-center justify-between gap-3 py-3 px-2"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative size-11 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-36">
                              {user.name}
                            </span>

                            {user.verificationTier && (
                              <VerifiedBadge
                                tier={user.verificationTier}
                                name={user.name}
                                size="sm"
                              />
                            )}
                          </div>

                          <p className="text-[10px] text-neutral-500 font-mono truncate">
                            @{user.handle}
                          </p>

                          <p className="text-[10px] text-neutral-600">
                            {user.followersCount} followers
                          </p>
                        </div>
                      </div>

                      {/* Follow Toggle */}
                      <button
                        type="button"
                        disabled={loadingFollowId === user.id}
                        onClick={() => toggleFollow(user.id)}
                        className={`shrink-0 min-w-[92px] px-4 py-2 rounded-full text-[10px] font-bold transition-all disabled:opacity-50 disabled:cursor-wait ${
                          user.isFollowing
                            ? "bg-transparent text-white border border-neutral-700 hover:border-red-600 hover:text-red-500 hover:bg-red-950/20"
                            : "bg-[#ff0000] text-white hover:bg-red-600"
                        }`}
                      >
                        {loadingFollowId === user.id
                          ? <Preloader size="sm" />
                          : user.isFollowing
                            ? "Following"
                            : "Follow"}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </main>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
