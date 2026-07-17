"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

// Configuration for link array mapping
const SERVICES_LINKS = [
  {
    title: "Stackgate International",
    subtitle: "Premium Web Solutions & Design Architectures",
    url: "https://stackgate.online", // Update to actual live url
    icon: "/stackgate_logo.png", 
  },
  {
    title: "Stack Menu",
    subtitle: "Installable Restaurant Management Application",
    url: "https://stackmenu.online", // Update to actual live url
    icon: "/stackmenu_logo.png",
  },
  {
    title: "Daily Devotionals",
    subtitle: "Knowing God — The Daily Secret Place",
    url: "/devotional", // Routes internally to your new devotional page
    icon: "/devotional_logo.png",
  },
  {
    title: "Let's Build Together",
    subtitle: "Direct Channel via WhatsApp Business",
    url: "https://wa.me/2349160979848?text=Hi%20Alexander%2C%20I%27d%20like%20to%20hire%20you.",
    icon: "/whatsapp_icon.png",
  }
];

// Spring kinematics variant definitions for Apple-like elasticity
const containerVariants:Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants:Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      mass: 0.4,
      damping: 10,
      stiffness: 110,
    },
  },
};

export default function ProfilePage() {
  return (
    <main className="w-full min-h-screen flex flex-col pb-16 bg-black selection:bg-neutral-900">
      
      {/* 1. X / LinkedIn Themed Banner Asset Layer */}
      <div className="w-full h-48 relative bg-neutral-900 border-b border-neutral-900/40">
        <Image
          src="https://www.wallpaperize.cc/2025/04/dark-topographic-lines-abstract-4k.html" // Path configuration mapped to your /public folder
          alt="Alexander D Bridge Banner"
          fill
          priority
          className="object-cover opacity-80"
        />
      </div>

      {/* 2. Overlapping Centered Identity Frame */}
      <div className="w-full max-w-xl mx-auto px-6 flex flex-col items-center">
        <div className="relative -mt-24 z-10">
          <div className="w-40 h-40 rounded-full relative overflow-hidden border-4 border-black bg-neutral-900 ring-2 ring-neutral-900">
            <Image
              src="/alexander_logo.png"
              alt="Alexander D Bridge Display Picture"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

        {/* 3. Primary Name and Subtitle Description Markup */}
        <div className="text-center mt-5 mb-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-100">
            Alexander D Bridge
          </h1>
          <p className="text-sm font-medium tracking-wide text-neutral-400 uppercase">
            Founder & Tech Director at Stackgate International
          </p>
          <p className="text-xs max-w-sm mx-auto text-neutral-500 leading-relaxed">
            Building premium, high-performance web platforms and digital products with functional art mechanics.
          </p>
        </div>

        {/* 4. Apple-inspired Interactive Staggered Link Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full space-y-4"
        >
          {SERVICES_LINKS.map((link, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              <Link
                href={link.url}
                target={link.url.startsWith("http") ? "_blank" : undefined}
                rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700/80 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
              >
                {/* Embedded Circle Icon Visual */}
                <div className="w-12 h-12 rounded-xl relative overflow-hidden hrink-0 bg-neutral-900 border border-neutral-700/30">
                  <Image
                    src={link.icon}
                    alt={`${link.title} Icon`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    fallback-src="/alexander_logo.png" // Safety default profile visual
                  />
                </div>

                {/* Info Text Flow alignment */}
                <div className="flex-1 min-w-0 text-left">
                  <h2 className="text-base font-semibold text-neutral-200 group-hover:text-white transition-colors">
                    {link.title}
                  </h2>
                  <p className="text-xs text-neutral-500 line-clamp-1">
                    {link.subtitle}
                  </p>
                </div>

                {/* Chevron Interactive Callout */}
                <svg
                  className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 group-hover:translate-x-0.5 transition-all"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}