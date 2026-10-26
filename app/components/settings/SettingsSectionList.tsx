"use client";

import React, { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsSection } from "../../types/settings";
import { Settings2 } from "lucide-react";

interface SettingsSectionListProps {
  sections: SettingsSection[];
}

export function SettingsSectionList({ sections }: SettingsSectionListProps) {
  const [selectedItemLabel, setSelectedItemLabel] = useState<string | null>(null);

  return (
    <>
      <div className="px-6 space-y-6 bg-black">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="rounded-3xl bg-neutral-950 border border-neutral-900 overflow-hidden divide-y divide-neutral-900">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemLabel(item.label)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-900/50 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-neutral-900 text-neutral-300 group-hover:text-white group-hover:bg-neutral-800 transition-colors">
                        <Icon className="size-4" />
                      </div>
                      <span className="text-xs font-bold text-white">
                        {item.label}
                      </span>
                    </div>
                    <FaChevronRight className="size-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* "Feature On The Way" Popup Modal */}
      <AnimatePresence>
        {selectedItemLabel && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            {/* Backdrop Click to Close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItemLabel(null)}
              className="absolute inset-0"
            />

            {/* Glass Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className="relative w-full max-w-xs rounded-3xl bg-neutral-950 border border-neutral-800 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center space-y-4 z-10"
            >
              {/* Close Icon */}
              <button
                type="button"
                onClick={() => setSelectedItemLabel(null)}
                className="absolute top-3 right-3 size-7 rounded-full bg-neutral-900 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <IoClose className="size-4" />
              </button>

              {/* Red Badge Icon */}
              <div className="size-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.2)]">
                <Settings2 className="size-7" />
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">
                  Feature On The Way
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed px-2">
                  <span className="text-neutral-200 font-semibold">{selectedItemLabel}</span> is currently under development. Stay tuned for updates!
                </p>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedItemLabel(null)}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}