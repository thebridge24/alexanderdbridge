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
    <div className=" fixed bottom-0 z-9999 left-0 w-full flex justify-center">
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
        className={`relative z-10 md:pb-6 flex md:px-4 pointer-events-none w-full md:max-w-md ${className}`}
      >
        <motion.nav
          initial={false}
          animate={{
            y: isMinimized ? 80 : 0,
          }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full pointer-events-auto relative flex items-center justify-around px-2 py-2 pb-4 md:rounded-full bg-black/5 backdrop-saturate-200"
          style={{ backdropFilter: "blur(20px) saturate(180%)" }}
        >
          <div className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

          {items.map((item) => {
            // Determine route activity cleanly under the /devotional/ namespace
            const isActive = (() => {
              if (!item.href) return false;

              // Direct root homepage check
              if (item.href === "/") return pathname === "/";

              // Standard exact route or specific sub-path match (e.g. /devotional/community)
              if (item.href !== "/devotional") {
                return (
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                );
              }

              // Special check for the main Devotional tab:
              // Active on /devotional OR /devotional/[dateString], but NOT on /devotional/community, /devotional/journal, etc.
              const isOtherDevotionalSection =
                pathname.startsWith("/devotional/community") ||
                pathname.startsWith("/devotional/journal") ||
                pathname.startsWith("/devotional/profile") ||
                pathname.startsWith("/devotional/profile-settings") ||
                pathname.startsWith("/devotional/messages");

              return (
                pathname.startsWith("/devotional") && !isOtherDevotionalSection
              );
            })();

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
                className={`relative group flex flex-col items-center justify-center h-full py-1 sm:px-4 rounded-full transition-all duration-300 cursor-pointer w-full ${
                  isActive
                    ? "bg-white/20 text-white "
                    : "text-white hover:text-neutral-200 hover:bg-white/5"
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
                      className={`size-6 rounded-full overflow-hidden border ${isActive ? "border-white" : "border-neutral-700"}`}
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
            <div className="w-full absolute bottom-0 h-20 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />

    </div>
  );
}
