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
          <div className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-neutral-800 bg-neutral-900">
            <img
              src={adminAvatar}
              alt={adminName}
              className="w-full h-full object-cover"
            />
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
