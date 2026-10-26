"use client";

import React, { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  NavItemConfig,
  GlassBottomNav,
} from "@/app/components/layout/GlassBottomNav";
import {
  HiOutlineUsers,
  HiUsers,
  HiOutlineBookOpen,
  HiBookOpen,
  HiPencilAlt,
  HiOutlineUser,
  HiUser,
} from "react-icons/hi";
import { LuNotebookPen } from "react-icons/lu";

export default function GlobalAppWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Load authenticated Supabase user profile avatar
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setUser(data.session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const userAvatarUrl = user?.user_metadata?.avatar_url || null;

  const navItems: NavItemConfig[] = [
    {
      id: "community",
      label: "Community",
      href: "/devotional/community",
      icon: (props) => <HiOutlineUsers className={props?.className} />,
      activeIcon: (props) => <HiUsers className={props?.className} />,
    },
    {
      id: "devotional",
      label: "Devotional",
      href: "/devotional",
      icon: (props) => <HiOutlineBookOpen className={props?.className} />,
      activeIcon: (props) => <HiBookOpen className={props?.className} />,
    },
    {
      id: "journal",
      label: "Journal",
      href: "/devotional/journal",
      icon: (props) => <LuNotebookPen className={props?.className} />,
      activeIcon: (props) => <HiPencilAlt className={props?.className} />,
    },
    {
      id: "account",
      label: "Profile",
      href: "/devotional/profile-settings",
      avatarUrl: userAvatarUrl,
      icon: (props) => <HiOutlineUser className={props?.className} />,
      activeIcon: (props) => <HiUser className={`${props?.className} text-red-500`} />,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white relative pb-28">
      {children}
      {/* Global Glass Bottom Navigation */}
      <GlassBottomNav items={navItems} className="w-[80vw]" />
    </div>
  );
}