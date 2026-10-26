/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Import your page views here
import SettingsPage from "@/app/devotional/profile-settings/page";

interface DevotionalContainerProps {
  children: React.ReactNode;
  devotional: any;
}

export default function DevotionalContainer({ children }: DevotionalContainerProps) {
  // Screen state switcher: "devotional" | "community" | "journal" | "profile"
  const [activeTab, setActiveTab] = useState<string>("devotional");
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

  // Define nav items with onClick state switches
  const navItems: NavItemConfig[] = [
    {
      id: "community",
      label: "Community",
      href: "/community",
      onClick: () => setActiveTab("community"),
      icon: (props) => <HiOutlineUsers className={props?.className} />,
      activeIcon: (props) => <HiUsers className={props?.className} />,
    },
    {
      id: "devotional",
      label: "Devotional",
      href: "/devotional",
      onClick: () => setActiveTab("devotional"),
      icon: (props) => <HiOutlineBookOpen className={props?.className} />,
      activeIcon: (props) => <HiBookOpen className={props?.className} />,
    },
    {
      id: "journal",
      label: "Journal",
      href: "/journal",
      onClick: () => setActiveTab("journal"),
      icon: (props) => <LuNotebookPen className={props?.className} />,
      activeIcon: (props) => <LuNotebookPen className={props?.className} />,
    },
    {
      id: "account",
      label: "Profile",
      avatarUrl: userAvatarUrl,
      onClick: () => setActiveTab("profile"),
      icon: (props) => <HiOutlineUser className={props?.className} />,
      activeIcon: (props) => <HiUser className={`${props?.className} text-primary`} />,
    },
  ];

  // Render the current view based on activeTab state
  const renderCurrentView = () => {
    switch (activeTab) {
      case "profile":
        return <SettingsPage />;
      case "devotional":
      default:
        return children; // Renders DevotionalView passed from Server Page
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative pb-28">
      {/* Dynamic Screen View */}
      {renderCurrentView()}

      {/* Persistent Floating Apple Liquid Glass Bottom Navigation */}
      <GlassBottomNav items={navItems} className="w-[80vw]" />
    </div>
  );
}