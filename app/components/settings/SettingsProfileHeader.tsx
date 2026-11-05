/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { useRouter } from "next/navigation";
import { FaCamera, FaBirthdayCake, FaMapMarkerAlt } from "react-icons/fa";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { UserProfileSettings } from "../../types/settings";
import { Mail, X, Check, RotateCcw } from "lucide-react";

// ======================================================
// DATA & CONFIGURATION
// ======================================================

interface SettingsProfileHeaderProps {
  profile: UserProfileSettings & {
    followingCount?: number;
    followersCount?: number;
  };
  onBannerChange: (file: File) => void;
  onAvatarChange: (file: File) => void;
}

interface CropModalProps {
  file: File;
  type: "banner" | "avatar";
  onClose: () => void;
  onCrop: (file: File) => void;
}

const CROP_CONFIG = {
  banner: {
    aspect: 3 / 1,
    title: "Crop Banner",
    description: "Position your image to fit your profile banner.",
  },
  avatar: {
    aspect: 1,
    title: "Crop Profile Picture",
    description: "Position your image inside the circular profile frame.",
  },
};

// ======================================================
// IMAGE PROCESSING
// ======================================================

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  originalFile: File,
): Promise<File> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not process this image.");
  }

  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const outputType = ["image/png", "image/webp"].includes(originalFile.type)
    ? originalFile.type
    : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Image export failed."));
      },
      outputType,
      0.94,
    );
  });

  const extension =
    outputType === "image/png"
      ? "png"
      : outputType === "image/webp"
        ? "webp"
        : "jpg";

  const fileName =
    originalFile.name.replace(/\.[^/.]+$/, "") + "-cropped." + extension;

  return new File([blob], fileName, {
    type: outputType,
    lastModified: Date.now(),
  });
}

// ======================================================
// CROP POPUP
// ======================================================

function ImageCropModal({ file, type, onClose, onCrop }: CropModalProps) {
  const config = CROP_CONFIG[type];

  const [imageSrc, setImageSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setImageSrc(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      setError("");

      const croppedFile = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        file,
      );

      onCrop(croppedFile);
    } catch (err) {
      console.error("Image cropping failed:", err);
      setError("Unable to crop this image. Please try another one.");
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#101010] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-white">{config.title}</h2>
            <p className="mt-1 text-[11px] text-neutral-400">
              {config.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/5 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="px-4 sm:px-6">
          <div
            className={`relative w-full overflow-hidden rounded-2xl bg-[#080808] ${
              type === "banner" ? "aspect-3/2" : "aspect-square"
            }`}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={config.aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              minZoom={1}
              maxZoom={5}
              zoomWithScroll
              restrictPosition
              cropShape="rect"
              showGrid
              style={{
                containerStyle: {
                  background: "#080808",
                },
                cropAreaStyle: {
                  border: "2px solid white",
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.68)",
                },
              
              }}
            />
          </div>

          {/* Instructions */}
          <div className="flex items-center justify-center gap-2 py-4 text-[11px] text-neutral-400">
            <span className="size-1.5 rounded-full bg-[#ff0000]" />
            Drag to position
            <span className="mx-1 text-neutral-700">•</span>
            Pinch to zoom
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/5 px-5 py-4 sm:px-6">
          {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={resetCrop}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2.5 text-xs font-semibold text-neutral-300 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleCrop}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex items-center gap-2 rounded-full bg-[#ff0000] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// PROFILE HEADER
// ======================================================

export function SettingsProfileHeader({
  profile,
  onBannerChange,
  onAvatarChange,
}: SettingsProfileHeaderProps) {
  const router = useRouter();

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<"banner" | "avatar">("banner");

  // File selection
  const openCropper = (file: File | undefined, type: "banner" | "avatar") => {
    if (!file || !file.type.startsWith("image/")) return;

    setCropType(type);
    setCropFile(file);
  };

  // Apply cropped image
  const handleCropComplete = (croppedFile: File) => {
    if (cropType === "banner") {
      onBannerChange(croppedFile);
    } else {
      onAvatarChange(croppedFile);
    }

    setCropFile(null);
  };

  return (
    <div className="relative w-full bg-black">
      {/* Banner */}
      <div className="relative h-44 w-full overflow-hidden border-b border-neutral-900 bg-neutral-900">
        {profile.bannerUrl ? (
          <img
            src={profile.bannerUrl}
            alt="Profile Banner"
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-linear-to-r from-neutral-900 via-neutral-800 to-neutral-900" />
        )}

        <button
          type="button"
          onClick={() => bannerInputRef.current?.click()}
          className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
        >
          <FaCamera className="size-3" />
          Edit Banner
        </button>

        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            openCropper(e.target.files?.[0], "banner");
            e.target.value = "";
          }}
        />
      </div>

      {/* Avatar & Information */}
      <div className="relative px-6 pb-6">
        <div className="mb-4 -mt-16 flex items-end justify-between md:-mt-21">
          <div className="group relative size-32 rounded-full border-4 border-[#ff0000] bg-black p-1 shadow-2xl md:size-40">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center rounded-full bg-neutral-900 text-xl font-bold text-white">
                {(profile.name || "U").charAt(0).toUpperCase()}
              </div>
            )}

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <FaCamera className="size-5" />
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                openCropper(e.target.files?.[0], "avatar");
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* User Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
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
            <Mail className="size-3.5" />
            {profile.email}
          </div>

          <div className="flex items-center gap-4 font-mono text-xs text-neutral-400">
            {profile.birthday && (
              <div className="flex items-center gap-1.5">
                <FaBirthdayCake className="size-3.5 text-neutral-500" />
                <span>{profile.birthday}</span>
              </div>
            )}

            {profile.location && (
              <div className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="size-3.5 text-neutral-500" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="max-w-lg pt-1 text-xs leading-relaxed text-neutral-300">
              {profile.bio}
            </p>
          )}

          {/* Following & Followers */}
          <div className="flex items-center gap-6 pt-3 text-xs">
            <button
              type="button"
              onClick={() => router.push("/devotional/community/following")}
              className="flex cursor-pointer items-center gap-1.5 text-neutral-400 hover:underline"
            >
              <span className="font-mono font-bold text-white">
                {profile.followingCount ?? 0}
              </span>
              <span>Following</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/devotional/community/followers")}
              className="flex cursor-pointer items-center gap-1.5 text-neutral-400 hover:underline"
            >
              <span className="font-mono font-bold text-white">
                {profile.followersCount ?? 0}
              </span>
              <span>Followers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Crop Popup */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          type={cropType}
          onClose={() => setCropFile(null)}
          onCrop={handleCropComplete}
        />
      )}
    </div>
  );
}
