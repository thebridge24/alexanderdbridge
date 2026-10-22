/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiGrid,
  FiBookOpen,
  FiUsers,
  FiMessageSquare,
  FiBarChart2,
  FiSliders,
  FiShield,
  FiX,
  FiAward,
} from "react-icons/fi";
import { clsx } from "clsx";
import { Flame } from "lucide-react";

export const NAVIGATION_GROUPS = [
  {
    title: "Devotional Core",
    items: [
      { name: "Overview", href: "/admin/overview", icon: FiGrid },
      { name: "Devotionals", href: "/admin/devotionals", icon: FiBookOpen },
      {
        name: "Community Feedback",
        href: "/admin/feedback",
        icon: FiMessageSquare,
      },
    ],
  },
  {
    title: "Users & Engagement",
    items: [
      { name: "Users Analytics", href: "/admin/users", icon: FiUsers },
      { name: "Streaks & Leaderboard", href: "/admin/streaks", icon: Flame },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: FiUsers },
      { name: "Verified Badges", href: "/admin/badges", icon: FiAward },
      { name: "Analytics", href: "/admin/analytics", icon: FiBarChart2 },
    ],
  },
  {
    title: "System & Management",
    items: [
      { name: "Audit Logs", href: "/admin/audit-logs", icon: FiShield },
      { name: "Settings", href: "/admin/settings", icon: FiSliders },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/80 xl:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 w-64 bg-black border-r border-neutral-800 transform transition-transform duration-200 ease-in-out xl:translate-x-0 flex flex-col justify-between",
          isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Branding */}
          <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-neutral-800">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center">
                <img
                  src="/brand-logo/bridge_daily_logo_black.png"
                  alt="Bridge Daily Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-sm text-white leading-none">
                  Bridge Daily
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 mt-0.5">
                  Devotional Admin
                </span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="xl:hidden text-neutral-400 hover:text-white cursor-pointer"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Grouped Nav Items */}
          <nav className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
            {NAVIGATION_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-3 rounded-full text-xs font-medium transition-all",
                        isActive
                          ? "bg-red-600 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900/50",
                      )}
                    >
                      <Icon
                        size={16}
                        className={isActive ? "text-white" : "text-neutral-400"}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Identity */}
        <div className="p-4 shrink-0 border-t border-neutral-800 bg-black">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-8 w-8 rounded-full bg-red-950/80 border border-red-900/50 flex items-center justify-center font-bold text-xs text-red-400">
              BD
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold truncate text-white">
                Bridge Daily
              </span>
              <span className="text-[10px] font-mono text-neutral-500 truncate">
                Devotional Admin v1.0
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
