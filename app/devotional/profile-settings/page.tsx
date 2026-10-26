"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SettingsProfileHeader } from "@/app/components/settings/SettingsProfileHeader";
import { SettingsSectionList } from "@/app/components/settings/SettingsSectionList";
import { UserProfileSettings, SettingsSection } from "../../types/settings";
import { 
  FaUserEdit, 
  FaLock, 
  FaCrown, 
  FaFileContract, 
  FaGlobe, 
  FaSignOutAlt 
} from "react-icons/fa";
import Preloader from "@/app/components/ui/Preloader";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileSettings>({
    id: "",
    name: "",
    email: "",
    avatarUrl: "",
    bannerUrl: "",
    birthday: "",
    location: "",
    bio: "",
    verificationTier: null,
  });

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          router.push("/auth");
          return;
        }

        // Fetch verification tier
        let tier = null;
        try {
          const res = await fetch("/api/users/verification", {
            headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
          });
          if (res.ok) {
            const json = await res.json();
            tier = json.verification_tier;
          }
        } catch {}

        setProfile({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          email: user.email || "",
          avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
          bannerUrl: user.user_metadata?.banner_url || "",
          birthday: user.user_metadata?.birthday || "15 Nov 2024", // Editable in profile
          location: user.user_metadata?.location || "Benin City, Nigeria", // Editable in profile
          bio: user.user_metadata?.bio || "Passionate about faith, devotion, and living a purposeful daily lifestyle!",
          verificationTier: tier,
        });
      } catch (err) {
        console.error("Error loading settings profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const handleBannerUpload = async (file: File) => {
    // Implement storage upload or update metadata here
    const fakeUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, bannerUrl: fakeUrl }));
  };

  const handleAvatarUpload = async (file: File) => {
    const fakeUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, avatarUrl: fakeUrl }));
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "General",
      items: [
        { id: "profile", label: "Profile Edit", icon: FaUserEdit, href: "/devotional/profile/edit" },
        { id: "password", label: "Password & Security", icon: FaLock, href: "/devotional/settings/security" },
        { id: "subscription", label: "Subscription & Patron", icon: FaCrown, href: "/devotional/support" },
      ],
    },
    {
      title: "Others",
      items: [
        { id: "terms", label: "Terms & Conditions", icon: FaFileContract, href: "/devotional/terms" },
        { id: "language", label: "Language & Region", icon: FaGlobe, href: "/devotional/settings/language" },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Preloader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32 space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Banner Profile Section */}
      <SettingsProfileHeader
        profile={profile}
        onBannerChange={handleBannerUpload}
        onAvatarChange={handleAvatarUpload}
      />

      {/* Navigation Links Sections */}
      <SettingsSectionList sections={settingsSections} />

      {/* Logout Action Button */}
      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 rounded-3xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xl"
        >
          <FaSignOutAlt className="size-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}