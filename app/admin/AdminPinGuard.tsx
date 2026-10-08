"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const CORRECT_PIN = "1961";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface AdminPinGuardProps {
  children: React.ReactNode;
}

export default function AdminPinGuard({ children }: AdminPinGuardProps) {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isError, setIsError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = window.sessionStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
    setChecking(false);
  }, []);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);
      setIsError(false);

      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("admin_auth", "true");
          }
          setIsAuthenticated(true);
        } else {
          setIsError(true);
          setTimeout(() => {
            setPin("");
            setIsError(false);
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="size-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-black text-white selection:bg-neutral-800 relative flex flex-col items-center justify-center p-6 z-50">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-900/40 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-8 max-w-sm w-full z-10"
      >
        <div className="text-center">
          <h2 className="text-xl font-black tracking-tight text-white mb-1">
            Admin Access Required
          </h2>
          <p className="uppercase text-xs tracking-widest text-neutral-400">
            Enter Passcode
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border transition-all duration-200
              ${
                pin.length > i
                  ? "bg-[#ff0000] border-[#ff0000] shadow-[0_0_12px_rgba(255,0,0,0.6)]"
                  : "border-neutral-700 bg-neutral-900/50"
              }
              ${isError ? "animate-shake border-red-500 bg-red-600" : ""}`}
            />
          ))}
        </div>

        {/* PIN Keypad Grid */}
        <div className="flex flex-wrap w-70 justify-center gap-4 relative">
          {KEYS.map((key, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleKeyPress(key)}
              className={`w-20 h-20 rounded-full ${
                isError ? "animate-shake border border-red-500/50" : ""
              } text-2xl font-medium bg-neutral-900/80 text-white border border-neutral-800 active:scale-95 hover:bg-neutral-800 transition duration-150 cursor-pointer flex items-center justify-center`}
            >
              {key}
            </button>
          ))}

          {pin.length > 0 && (
            <button
              type="button"
              onClick={handleBackspace}
              aria-label="Clear digit"
              className="absolute left-4 bottom-2 p-4 rounded-full text-neutral-400 hover:text-white transition duration-100 cursor-pointer"
            >
              <svg
                className="size-7"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
              >
                <path
                  d="m 7 2 c -0.832031 0 -1.558594 0.34375 -2.292969 0.78125 s -1.464843 1.003906 -2.128906 1.597656 c -0.660156 0.597656 -1.253906 1.222656 -1.707031 1.796875 c -0.226563 0.289063 -0.417969 0.5625 -0.570313 0.835938 c -0.152343 0.277343 -0.300781 0.53125 -0.300781 0.988281 s 0.148438 0.710938 0.300781 0.984375 c 0.152344 0.277344 0.34375 0.550781 0.570313 0.835937 c 0.453125 0.578126 1.046875 1.203126 1.707031 1.796876 c 0.664063 0.597656 1.394531 1.164062 2.128906 1.601562 s 1.460938 0.78125 2.292969 0.78125 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z"
                />
              </svg>
            </button>
          )}
        </div>

        <Link
          href="/"
          className="text-xs text-neutral-400 hover:text-white transition opacity-75 hover:opacity-100 mt-2"
        >
          Cancel & Return Home
        </Link>
      </motion.div>
    </div>
  );
}
