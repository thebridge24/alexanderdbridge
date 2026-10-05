"use client";

import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";
import PushNotifications from "@/alexanderdbridge/app/notifications/PushNotifications";
import AuthButton from "@/alexanderdbridge/app/auth/AuthButton";

export default function Header() {
  return (
    <header className="fixed top-4 left-0 right-0 max-w-2xl mx-auto px-6 flex items-center justify-between z-50 pointer-events-none">
      {/* Back Button */}
      <div className="pointer-events-auto">
        <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl">
          <Link
            href="/"
            className="size-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
            aria-label="Go back"
          >
            <IoArrowBack className="size-5" />
          </Link>
        </div>
      </div>

      {/* Right Controls: Push Notifications & Auth Dropdown */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <PushNotifications />
        <AuthButton />
      </div>
    </header>
  );
}