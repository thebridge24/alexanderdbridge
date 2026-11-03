
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/images/compressImage";
import { SettingsProfileHeader } from "@/app/components/settings/SettingsProfileHeader";
import { SettingsSectionList } from "@/app/components/settings/SettingsSectionList";
import {
  UserProfileSettings,
  SettingsSection,
} from "../../types/settings";

import {
  FaUserEdit,
  FaLock,
  FaCrown,
  FaFileContract,
  FaGlobe,
  FaSignOutAlt,
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

  // ==========================================
  // LOAD USER PROFILE
  // ==========================================

  useEffect(() => {
    let active = true;

    async function loadUserData() {
      try {
        const supabase = createSupabaseBrowserClient();

        if (!supabase) {
          throw new Error("Supabase client unavailable");
        }

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const session = sessionData.session;
        const user = session?.user;

        if (!user || !session?.access_token) {
          router.push("/auth");
          return;
        }

        const token = session.access_token;

        // --------------------------------------
        // Fetch verification tier
        // --------------------------------------

        let tier = null;

        try {
          const res = await fetch("/api/users/verification", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          if (res.ok) {
            const json = await res.json();
            tier = json.verification_tier;
          }
        } catch (error) {
          console.error("Verification fetch error:", error);
        }

        // --------------------------------------
        // Fetch follower and following counts
        // --------------------------------------

        let followCounts = {
          followersCount: 0,
          followingCount: 0,
        };

        try {
          const res = await fetch("/api/users/me/follow-counts", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          if (res.ok) {
            const json = await res.json();

            followCounts = {
              followersCount: json.followersCount ?? 0,
              followingCount: json.followingCount ?? 0,
            };
          }
        } catch (error) {
          console.error("Follow counts fetch error:", error);
        }

        // --------------------------------------
        // Fetch saved banner from GET endpoint
        // --------------------------------------

        let bannerUrl = user.user_metadata?.banner_url || "";

        try {
          const bannerRes = await fetch("/api/users/me/banner", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          if (bannerRes.ok) {
            const bannerData = await bannerRes.json();

            bannerUrl = bannerData.bannerUrl || "";
          } else {
            console.error(
              "Banner fetch failed:",
              await bannerRes.text()
            );
          }
        } catch (error) {
          console.error("Error fetching profile banner:", error);
        }

        // --------------------------------------
        // Populate profile
        // --------------------------------------

        if (!active) return;

        setProfile({
          id: user.id,

          ...followCounts,

          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "",

          email: user.email || "",

          avatarUrl:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            "",

          bannerUrl,

          birthday: user.user_metadata?.birthday || "26 Oct 2026",

          location:
            user.user_metadata?.location ||
            "Benin City, Nigeria",

          bio:
            user.user_metadata?.bio ||
            "Passionate about faith, devotion, and living a purposeful daily lifestyle!",

          verificationTier: tier,
        });
      } catch (err) {
        console.error("Error loading settings profile:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUserData();

    return () => {
      active = false;
    };
  }, [router]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();

    if (supabase) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  // ==========================================
  // UPLOAD BANNER
  // ==========================================

  const handleBannerUpload = async (file: File) => {
    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        throw new Error("Supabase client unavailable");
      }

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      const token = sessionData.session?.access_token;

      if (!token) {
        alert("Please sign in to change your banner.");
        return;
      }

      // Compress image
      const compressed = await compressImage(file);

      const form = new FormData();

      form.append(
        "file",
        new File([compressed], "banner.jpg", {
          type: compressed.type || "image/jpeg",
        })
      );

      // Upload to API
      const res = await fetch("/api/users/me/banner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Banner upload failed");
      }

      if (!data.bannerUrl) {
        throw new Error("No banner URL returned from server.");
      }

      // Update profile immediately
      setProfile((prev) => ({
        ...prev,
        bannerUrl: data.bannerUrl,
      }));

      alert("Profile banner updated successfully!");
    } catch (err) {
      console.error("Banner upload error:", err);

      alert(
        err instanceof Error
          ? err.message
          : "Banner upload failed"
      );
    }
  };

  // ==========================================
  // AVATAR UPLOAD
  // ==========================================

  const handleAvatarUpload = async (file: File) => {
    // Temporary preview only.
    // A permanent avatar requires its own storage upload API.
    const fakeUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      avatarUrl: fakeUrl,
    }));
  };

  // ==========================================
  // SETTINGS NAVIGATION
  // ==========================================

  const settingsSections: SettingsSection[] = [
    {
      title: "General",
      items: [
        {
          id: "profile",
          label: "Profile Edit",
          icon: FaUserEdit,
          href: "/devotional/profile-settings/edit",
        },
        {
          id: "password",
          label: "Password & Security",
          icon: FaLock,
          href: "/devotional/profile-settings/security",
        },
        {
          id: "subscription",
          label: "Subscription & Bills",
          icon: FaCrown,
          href: "/devotional/profile-settings/support",
        },
      ],
    },
    {
      title: "Others",
      items: [
        {
          id: "terms",
          label: "Terms & Conditions",
          icon: FaFileContract,
          href: "/devotional/terms",
        },
        {
          id: "language",
          label: "Language & Region",
          icon: FaGlobe,
          href: "/devotional/profile-settings/language",
        },
      ],
    },
  ];

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Preloader />
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-black text-white pb-32 space-y-6 max-w-5xl mx-auto">

      {/* Profile Header & Banner */}

      <SettingsProfileHeader
        profile={profile}
        onBannerChange={handleBannerUpload}
        onAvatarChange={handleAvatarUpload}
      />

      {/* Navigation Sections */}

      <SettingsSectionList sections={settingsSections} />

      {/* Logout */}

      <div className="px-6 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 rounded-3xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-xl"
        >
          <FaSignOutAlt className="size-4" />
          <span>Log Out</span>
        </button>
      </div>

    </div>
  );
}
