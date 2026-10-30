/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FaChevronLeft, FaSearch } from "react-icons/fa";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";

interface UserItem {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  followersCount: string;
  isFollowing: boolean;
  isFollower?: boolean;
  verificationTier?: string;
}

const INITIAL_FOLLOWERS: UserItem[] = [
  {
    id: "1",
    name: "Evans Powell",
    handle: "@evanspowell",
    followersCount: "13 followers",
    isFollowing: false,
    isFollower: true,
  },
  {
    id: "2",
    name: "Insider",
    handle: "@insider",
    followersCount: "121k followers",
    isFollowing: true,
    isFollower: true,
    verificationTier: "supporter",
  },
  {
    id: "3",
    name: "Deadline Hollywood",
    handle: "@deadline",
    followersCount: "13k followers",
    isFollowing: false,
    isFollower: true,
  },
  {
    id: "4",
    name: "BuzzFeed",
    handle: "@buzzfeed",
    followersCount: "4.9m followers",
    isFollowing: false,
    isFollower: true,
    verificationTier: "partner",
  },
  {
    id: "5",
    name: "CNN",
    handle: "@cnn",
    followersCount: "63k followers",
    isFollowing: true,
    isFollower: true,
    verificationTier: "supporter",
  },
  {
    id: "6",
    name: "IMDb",
    handle: "@imdb",
    followersCount: "598k followers",
    isFollowing: false,
    isFollower: true,
  },
];

const INITIAL_FOLLOWING: UserItem[] = [
  {
    id: "10",
    name: "dinora_p0404",
    handle: "@dinora_p0404",
    followersCount: "45 followers",
    isFollowing: true,
    isFollower: false,
  },
  {
    id: "11",
    name: "Geo",
    handle: "@geo",
    followersCount: "320 followers",
    isFollowing: true,
    isFollower: false,
  },
  {
    id: "12",
    name: "Flickdatwristlzzy",
    handle: "@flickwrist",
    followersCount: "1.2k followers",
    isFollowing: true,
    isFollower: true,
  },
  {
    id: "13",
    name: "Alexaaaa",
    handle: "@alexa",
    followersCount: "890 followers",
    isFollowing: true,
    isFollower: false,
  },
  {
    id: "14",
    name: "destiny",
    handle: "@destiny",
    followersCount: "3.4k followers",
    isFollowing: true,
    isFollower: false,
  },
];

export default function FollowersFollowingPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab from route path or default
  const isFollowingRoute = pathname?.includes("/following");
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    isFollowingRoute ? "following" : "followers"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [followersList, setFollowersList] = useState<UserItem[]>(INITIAL_FOLLOWERS);
  const [followingList, setFollowingList] = useState<UserItem[]>(INITIAL_FOLLOWING);

  const toggleFollow = (id: string, currentTab: "followers" | "following") => {
    if (currentTab === "followers") {
      setFollowersList((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    } else {
      setFollowingList((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    }
  };

  const activeList = activeTab === "followers" ? followersList : followingList;
  const filteredList = activeList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabSwitch = (tab: "followers" | "following") => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/devotional/${tab}`);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800 pb-20">
      <div className="max-w-5xl mx-auto">
           {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-900 px-4 pt-4 pb-0">
        <div className="flex items-center gap-4 mb-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2.5 rounded-full hover:bg-neutral-900 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Go Back"
          >
            <FaChevronLeft size={16} />
          </button>

          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              Connections
            </h1>
            <p className="text-[11px] font-mono text-neutral-500">
              Manage your community
            </p>
          </div>
        </div>

        {/* Tab Switcher with Animated Sliding Underline */}
        <div className="flex items-center relative border-t border-neutral-900/60">
          <button
            type="button"
            onClick={() => handleTabSwitch("followers")}
            className={`flex-1 py-3 text-center text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "followers" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span>Followers</span>
            {activeTab === "followers" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff0000] rounded-full mx-auto w-24"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("following")}
            className={`flex-1 py-3 text-center text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === "following" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <span>Following</span>
            {activeTab === "following" && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff0000] rounded-full mx-auto w-24"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        </div>
      </header>

      {/* Search Input Bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative flex items-center">
          <FaSearch className="absolute left-4 text-neutral-500 size-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-neutral-900/90 border border-neutral-800 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 transition-colors"
          />
        </div>
      </div>

      {/* Connections List View */}
      <main className="px-2 pt-2 divide-y divide-neutral-900/80">
        {filteredList.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-xs font-mono text-neutral-500">
              No users found matching &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          filteredList.map((user) => {
            const isFollowing = user.isFollowing;
            const buttonLabel = isFollowing
              ? "Following"
              : user.isFollower
              ? "Follow back"
              : "Follow";

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between px-3 py-3 hover:bg-neutral-900/40 rounded-2xl transition-colors"
              >
                {/* User Info */}
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
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

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white leading-snug">
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
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {user.followersCount}
                    </div>
                  </div>
                </div>

                {/* Follow / Following Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleFollow(user.id, activeTab)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isFollowing
                      ? "bg-transparent text-white border border-neutral-700 hover:border-red-600 hover:text-red-500 hover:bg-red-950/20"
                      : "bg-[#ff0000] text-white hover:bg-red-600 shadow-red-950/50"
                  }`}
                >
                  {buttonLabel}
                </button>
              </motion.div>
            );
          })
        )}
      </main>
      </div>
   
    </div>
  );
}