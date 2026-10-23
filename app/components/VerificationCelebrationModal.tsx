/* eslint-disable @next/next/no-img-element */
// components/devotional/VerificationCelebrationModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoShareSocial, IoCheckmark } from "react-icons/io5";
import { useState, useRef, useEffect } from "react";
import { toBlob } from "html-to-image";
import { VerifiedBadge } from "@/app/components/VerifiedBadge";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getUserVerificationTier,
  VERIFICATION_TIERS,
} from "@/lib/utils/verification"; // Adjust path to your verification helper file

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationCelebrationModal({
  isOpen,
  onClose,
}: Props) {
  const [userName, setUserName] = useState("Believer");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>("supporter");
  const [isVerified, setIsVerified] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [hasDismissed, setHasDismissed] = useState(true);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch Supabase auth user, check metadata & whitelist fallback tier
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createSupabaseBrowserClient();
        if (!supabase) return;

        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (user) {
          const name =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Believer";

          const email = user.email || "";
          setUserName(name);
          setUserEmail(email);

          const avatar =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;
          setUserAvatar(avatar);

          const detectedTier = getUserVerificationTier({
            metadata: user.user_metadata,
            email,
            name,
          });

          if (detectedTier) {
            const dismissalKey = `bridge-daily-verification-dismissed-${user.id}-${detectedTier}`;

            setStorageKey(dismissalKey);

            const dismissed = localStorage.getItem(dismissalKey) === "true";

            setHasDismissed(dismissed);
            setUserTier(detectedTier);
            setIsVerified(true);
          } else {
            setStorageKey(null);
            setHasDismissed(true);
            setIsVerified(false);
          }
        }
      } catch (err) {
        console.error("Error loading auth user for celebration modal:", err);
      }
    }

    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  // Only show popup to verified users when open
if (!isOpen || !isVerified || hasDismissed) return null;

  const handleShareCard = async () => {
    if (!cardRef.current || isGenerating) return;

    setIsGenerating(true);

    let objectUrl: string | null = null;

    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 4,
        backgroundColor: "#000000",
      });

      if (!blob) {
        throw new Error("Failed to render image blob");
      }

      const file = new File([blob], "bridge-daily-verified.png", {
        type: "image/png",
      });

      const supportUrl = `${window.location.origin}/support`;

      const shareText =
        `✨ I just got verified on Bridge Daily!\n\n` +
        `Join our community of supporters and help keep God's Word accessible to believers everywhere.\n\n` +
        `Support the movement here:\n${supportUrl}`;

      const shareData = {
        title: "Bridge Daily Verified Supporter",
        text: shareText,
        url: supportUrl,
      };

      // 1. Share the image natively when supported.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          ...shareData,
          files: [file],
        });
      } else if (navigator.share) {
        // 2. Fallback to native text and link sharing.
        await navigator.share(shareData);
      } else {
        // 3. Desktop fallback: download the image.
        objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = "bridge-daily-verified.png";
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Copy the support message when clipboard access is available.
        try {
          await navigator.clipboard.writeText(
            `${shareText}\n\n${window.location.origin}`,
          );
          setCopied(true);
          window.setTimeout(() => setCopied(false), 3000);
        } catch (clipboardError) {
          console.warn("Could not copy share text:", clipboardError);
        }
      }
    } catch (err) {
      // Closing the native share sheet is not necessarily a real failure.
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("Error generating or sharing verification image:", err);
    } finally {
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000);
      }

      setIsGenerating(false);
    }
  };

  const currentTierInfo =
    VERIFICATION_TIERS[userTier as keyof typeof VERIFICATION_TIERS] ||
    VERIFICATION_TIERS.supporter;
  const tierHexColor = currentTierInfo.hexColor;

  const handleClose = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "true");
    }

    setHasDismissed(true);
    onClose();
  };
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-120 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm rounded-3xl bg-neutral-950 border border-neutral-800 p-2 text-center shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-2 rounded-full bg-neutral-900 border border-neutral-800 transition-colors z-20 cursor-pointer"
          >
            <IoClose className="w-5 h-5" />
          </button>

          {/* Card Graphic Container (Captured as Image) */}
          <div
            ref={cardRef}
            className="pt-6 pb-6 px-5 flex flex-col items-center bg-black rounded-2xl relative overflow-hidden border border-neutral-900"
          >
            {/* Ambient Background Flare */}
            <div
              style={{ backgroundColor: tierHexColor }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 opacity-40 rounded-full blur-3xl pointer-events-none"
            />

            {/* User Avatar with Verification Badge Overlay */}
            <div className="relative my-3">
              <div
                style={{ borderColor: tierHexColor }}
                className="w-20 h-20 rounded-full bg-neutral-800 border-4 overflow-hidden flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff1a1a] mt-1 mb-1">
              Community Recognition
            </span>

            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-1">
              {userName}{" "}
              <VerifiedBadge
                tier={userTier}
                name={userName}
                email={userEmail}
                size="lg"
                showLabel
              />
            </h3>

            <p className="text-xs text-white/70 mt-2 leading-relaxed px-2">
              Congratulations! You are now officially verified on Bridge Daily.
              Thank you for supporting us.
            </p>

            {/* Custom Call to Action Banner */}
            <div className="w-full text-left space-y-2 pt-4">
              <div className="my-4 w-full h-px bg-neutral-900" />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-[#ff1a1a] font-bold uppercase text-center w-full">
                  Upgrade & Support
                </span>
              </div>
              <p className="text-[8px] text-white/60 leading-relaxed text-center tracking-widest">
                https://alexanderdbridge.com
              </p>
            </div>
          </div>

          {/* Action Buttons (Excluded from Image Capture) */}
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              onClick={handleShareCard}
              disabled={isGenerating}
              className="w-full py-3 px-4 rounded-full bg-[#ff1a1a] hover:bg-red-600 disabled:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,26,26,0.3)] active:scale-95 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <span className="animate-pulse">Generating Image...</span>
              ) : copied ? (
                <>
                  <IoCheckmark className="w-4 h-4" /> Image Saved & Link Copied
                </>
              ) : (
                <>
                  <IoShareSocial className="w-4 h-4" /> Share Verification Card
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
