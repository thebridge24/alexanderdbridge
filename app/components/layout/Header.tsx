/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FiMenu, FiSearch } from "react-icons/fi";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenSearch: () => void;
}

export function Header({ onOpenSidebar, onOpenSearch }: HeaderProps) {
  const [adminName, setAdminName] = useState("Alexander D. Bridge");
  const [adminAvatar, setAdminAvatar] = useState("/avatar.png");

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
        if (metadata?.avatar_url || metadata?.picture) {
          setAdminAvatar(metadata.avatar_url || metadata.picture);
        }
      }
    });
  }, []);

  return (
    <header className="h-16 border-b border-neutral-800 bg-black/80 backdrop-blur-md flex items-center justify-between gap-8 px-4 sm:px-8 fixed xl:sticky w-full top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="xl:hidden text-neutral-400 hover:text-white p-1 transition-colors"
          aria-label="Open sidebar"
        >
          <FiMenu size={22} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center xl:hidden">
          <img
            src="/brand-logo/bridge_daily_logo_black.png"
            alt="Bridge Daily Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-xl font-bold hidden xs:block xl:hidden">
          Bridge Daily{" "}
          <span className="hidden sm:inline-block">Devotional</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
          aria-label="Search"
        >
          <FiSearch size={20} />
        </button>

        {/* Profile Avatar & Name */}
        <div className="shrink-0 flex items-center gap-3 pl-3 border-l border-neutral-800">
          {/* Avatar Container with Rotating Gradient Border */}
          <div className="relative h-10 w-10 rounded-full p-[2px] overflow-hidden bg-neutral-900 group">
            {/* Rotating Gradient Background Layer */}
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#ff0000,#ff6363,#ff0000)] animate-spin-slow opacity-80" />

            {/* Inner Container to Mask the Gradient into a Border */}
            <div className="relative h-full w-full rounded-full overflow-hidden bg-neutral-940 p-[1px]">
              <img
                src={adminAvatar}
                alt={adminName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>

          <div className="hidden xl:flex flex-col text-left">
            <span className="text-xs font-bold text-white">{adminName}</span>
            <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
              Lead Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
