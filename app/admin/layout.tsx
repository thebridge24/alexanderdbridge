/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";
import { MobileSearchDrawer } from "../components/layout/MobileSearchDrawer";

const CORRECT_PIN = "1961";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Passcode Lock State
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isError, setIsError] = useState(false);

  // Check existing session auth on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = window.sessionStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Handle PIN entry validation
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setTimeout(() => {
          setIsAuthenticated(true);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("admin_auth", "true");
          }
          setPin("");
        }, 200);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin("");
          setIsError(false);
        }, 1000);
      }
    }
  }, [pin]);

  const handleKeyPress = (key: string) => {
    if (pin.length === 4 || isError) return;
    setPin((prev) => prev + key);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen font-bricolage bg-black text-neutral-100 flex relative">
      {/* PASSCODE LOCKSCREEN OVERLAY (Covers everything until authenticated) */}
      <AnimatePresence mode="wait">
        {!isAuthenticated && (
          <motion.div
            key="lockscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-500 bg-black text-white flex flex-col items-center justify-center gap-10"
          >
            {/* Background Red Ambient Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />

            <p className="uppercase text-sm tracking-widest opacity-70 font-mono">
              Enter Passcode
            </p>

            <div className="flex gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border transition
                  ${pin.length > i ? "bg-[#ff0000] border-[#ff0000]" : "border-gray-600"}
                  ${isError ? "animate-shake" : ""}`}
                />
              ))}
            </div>

            <div className="flex flex-wrap w-70 justify-center gap-4 relative">
              {KEYS.map((key, i) => (
                <button
                  key={i}
                  onClick={() => handleKeyPress(key)}
                  className={`w-20 h-20 rounded-full ${isError ? "animate-shake" : ""} text-2xl font-medium bg-white/10 active:rounded-xl active:scale-95 text-white transition duration-200 active:bg-white/20 cursor-pointer`}
                >
                  {key}
                </button>
              ))}

              {pin.length > 0 && (
                <button
                  onClick={handleBackspace}
                  aria-label="clear button"
                  className="animate-fade absolute left-4 bottom-2 p-4 rounded-full duration-100 text-neutral-400 hover:text-white cursor-pointer"
                >
                  <svg
                    className="size-8"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                  >
                    <path
                      d="m 7 2 c -0.832031 0 -1.558594 0.34375 -2.292969 0.78125 s -1.464843 1.003906 -2.128906 1.597656 c -0.660156 0.597656 -1.253906 1.222656 -1.707031 1.796875 c -0.226563 0.289063 -0.417969 0.5625 -0.570313 0.835938 c -0.152343 0.277343 -0.300781 0.53125 -0.300781 0.988281 s 0.148438 0.710938 0.300781 0.984375 c 0.152344 0.277344 0.34375 0.550781 0.570313 0.835937 c 0.453125 0.578126 1.046875 1.203126 1.707031 1.796876 c 0.664063 0.597656 1.394531 1.164062 2.128906 1.601562 s 1.460938 0.78125 2.292969 0.78125 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              )}
            </div>

            <Link href="/" className="text-sm opacity-50 hover:opacity-100 transition text-white">
              Cancel
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="xl:w-64" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header 
          onOpenSidebar={() => setSidebarOpen(true)} 
          onOpenSearch={() => setSearchOpen(true)} 
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="h-15.75 xl:hidden"></div>
          <div className="space-y-8">{children}</div>
        </main>
      </div>

      {/* Mobile Slide-in Search Drawer */}
      <MobileSearchDrawer isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}