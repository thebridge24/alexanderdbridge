/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaDownload } from "react-icons/fa";

export function PwaInstallButton() {
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBubble, setShowBubble] = useState(false);

  // 1. PWA Standalone & Install Prompt Listeners + Development Fallback
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShowInstallBtn(false);
      return;
    }

    // Force show during development/testing if desired, or rely on browser prompt
    const forceShowForTesting = true; // Set to false once live in production if you only want it when prompt fires
    if (forceShowForTesting) {
      setShowInstallBtn(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 2. Recurring Bouncy Bubble Animation Loop (Shows every 9s, stays for 5s)
  useEffect(() => {
    if (!showInstallBtn) return;

    const initialTimer = setTimeout(() => {
      setShowBubble(true);
    }, 1500);

    const interval = setInterval(() => {
      setShowBubble((prev) => !prev);
    }, 9000); 

    const hideTimer = setInterval(() => {
      setShowBubble(false);
    }, 6500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      clearInterval(hideTimer);
    };
  }, [showInstallBtn]);

  const handleInstallClick = async () => {
    // 1. If native browser prompt is ready, trigger it directly
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setShowInstallBtn(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error:", err);
      }
      return;
    }

    // 2. iOS Safari or Unsupported Browsers: Custom Guidance
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      alert(
        "To Install Bridge Daily on iOS:\n\n1. Tap the Share button at the bottom of Safari.\n2. Scroll down and select 'Add to Home Screen'."
      );
    } else {
      alert(
        "To Install Bridge Daily:\n\nTap your browser options menu (three dots at the top right) and select 'Install App' or 'Add to Home Screen'."
      );
    }
  };

  if (!showInstallBtn) return null;

  return (
    <div className="relative flex items-center z-40">
      {/* Sliding Bouncy Bubble Text from Behind (Left) */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 15, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 350, damping: 24 }}
            className="absolute right-14 mr-2 whitespace-nowrap bg-neutral-900 border border-neutral-700/80 text-white text-xs font-medium px-3.5 py-2 rounded-2xl shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>Install as App</span>
            {/* Tiny Arrow pointing right towards button */}
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-neutral-900 border-r border-t border-neutral-700/80 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Button */}
      <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl relative">
        <button
          onClick={handleInstallClick}
          aria-label="Install App"
          className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all cursor-pointer"
        >
          <FaDownload className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}