/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { FaCamera, FaBirthdayCake, FaMapMarkerAlt } from "react-icons/fa";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { UserProfileSettings } from "../../types/settings";
import { Mail } from "lucide-react";

interface SettingsProfileHeaderProps {
  profile: UserProfileSettings & {
    followingCount?: number;
    followersCount?: number;
  };
  onBannerChange: (file: File) => void;
  onAvatarChange: (file: File) => void;
}

export function SettingsProfileHeader({
  profile,
  onBannerChange,
  onAvatarChange,
}: SettingsProfileHeaderProps) {
  const router = useRouter();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full bg-black">
      {/* Banner Image Container */}
      <div className="relative h-44 w-full bg-neutral-900 overflow-hidden border-b border-neutral-900">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt="Profile Banner"
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900" />
        )}

        {/* Change Banner Camera Button */}
        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer"
        >
          <FaCamera className="size-3" />
          <span>Edit Banner</span>
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) onBannerChange(e.target.files[0]);
          }}
        />
      </div>

      {/* Avatar & Info Section */}
      <div className="px-6 pb-6 relative">
        <div className="flex justify-between items-end -mt-16 md:-mt-21 mb-4">
          {/* Avatar with Camera Icon Overlay */}
          <div className="relative group size-32 md:size-40 rounded-full p-1 bg-black border-4 border-[#ff0000] shadow-2xl">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="size-full rounded-full bg-neutral-900 flex items-center justify-center text-xl font-bold text-white">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
            >
              <FaCamera className="size-5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) onAvatarChange(e.target.files[0]);
              }}
            />
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {profile.name || "Anonymous Believer"}
            </h1>
            {profile.verificationTier && (
              <VerifiedBadge
                tier={profile.verificationTier}
                name={profile.name}
                showLabel
                size="lg"
              />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Mail className="size-3.5" />   {profile.email}
          </div>

          <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono">
            {profile.birthday && (
              <div className="flex items-center gap-1.5">
                <FaBirthdayCake className="text-neutral-500 size-3.5" />
                <span>{profile.birthday}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-neutral-500 size-3.5" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="text-xs text-neutral-300 leading-relaxed pt-1 max-w-lg">
              {profile.bio}
            </p>
          )}

          {/* Following & Followers Stats Navigation Bar */}
          <div className="flex items-center gap-6 pt-3 text-xs">
            <button
              type="button"
              onClick={() => router.push("/devotional/following")}
              className="hover:underline flex items-center gap-1.5 cursor-pointer text-neutral-400"
            >
              <span className="font-bold text-white font-mono">
                {profile.followingCount ?? 0}
              </span>{" "}
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/devotional/followers")}
              className="hover:underline flex items-center gap-1.5 cursor-pointer text-neutral-400"
            >
              <span className="font-bold text-white font-mono">
                {profile.followersCount ?? 0}
              </span>{" "}
              <span>Followers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}