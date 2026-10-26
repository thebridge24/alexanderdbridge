/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

export interface NavItemConfig {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string; filled?: boolean }>;
  activeIcon?: React.ComponentType<{ className?: string; filled?: boolean }>;
  avatarUrl?: string | null; // Optional user avatar for account tab
}

interface GlassBottomNavProps {
  items: NavItemConfig[];
  className?: string;
}

export function GlassBottomNav({ items, className = "" }: GlassBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  // Safari-style dynamic scroll reaction
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    const diff = latest - previous;

    if (latest < 40) {
      setIsMinimized(false);
    } else if (diff > 6) {
      setIsMinimized(true);
    } else if (diff < -6) {
      setIsMinimized(false);
    }

    lastScrollY.current = latest;
  });

  return (
    <div className=" fixed bottom-6 z-9999 left-0 w-full flex justify-center">
      <svg
        className="hidden pointer-events-none absolute w-0 h-0"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="liquid-glass-distortion"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        className={` flex justify-center items-center px-4 pointer-events-none w-full max-w-md ${className}`}
      >
        <motion.nav
          initial={false}
          animate={{
            y: isMinimized ? 8 : 0,
            scale: isMinimized ? 0.96 : 1,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full pointer-events-auto relative flex items-center justify-around p-1.5 rounded-full bg-black/20 border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3),inset_0_-1px_1px_rgba(0,0,0,0.8)] backdrop-blur-2xl backdrop-saturate-200"
          style={{ backdropFilter: "blur(20px) saturate(180%)" }}
        >
          <div className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

          {items.map((item) => {
            // Sub-url active check: if href is /devotional, /devotional/2026-10-25 will also be active
            const isActive = item.href
              ? item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
              : false;

            const IconComponent =
              isActive && item.activeIcon ? item.activeIcon : item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.onClick) item.onClick();
                  if (item.href) router.push(item.href);
                }}
                className={`relative group flex flex-col items-center justify-center py-1 sm:px-4 rounded-full transition-all duration-300 cursor-pointer w-full ${
                  isActive
                    ? "bg-white/10 text-white "
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="glassActivePill"
                    className="absolute inset-0 rounded-full bg-white/10 -z-10 w-full"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <div
                  className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                >
                  {item.avatarUrl ? (
                    <div
                      className={`size-7 rounded-full overflow-hidden border ${isActive ? "border-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" : "border-neutral-700"}`}
                    >
                      <img
                        src={item.avatarUrl}
                        alt={item.label}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : IconComponent ? (
                    <IconComponent
                      className={`size-5 sm:size-5 ${isActive ? "" : "text-neutral-400"}`}
                      filled={isActive}
                    />
                  ) : null}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-0.5 transition-all ${
                    isActive ? " font-bold" : "text-neutral-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </motion.nav>
      </div>
    </div>
  );
}
