/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoEyeOutline } from "react-icons/io5";
import { formatRelativeTime } from "@/lib/utils/date";

interface Visitor {
  id: string;
  display_name: string;
  avatar_url: string;
  visited_at: string;
}

interface DevotionalVisitorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotionalDate: string;
}

export default function DevotionalVisitorsModal({
  isOpen,
  onClose,
  devotionalDate,
}: DevotionalVisitorsModalProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !devotionalDate) return;

    async function fetchVisitors() {
      setLoading(true);
      try {
        const res = await fetch(`/api/devotionals/${devotionalDate}/visitors`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setVisitors(data.visitors || []);
        }
      } catch (err) {
        console.error("Failed to load visitors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitors();
  }, [isOpen, devotionalDate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <IoEyeOutline className="size-5 text-neutral-400" />
                <h3 className="text-sm font-semibold text-neutral-200">
                  Recent Visitors
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <IoClose className="size-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="max-h-72 overflow-y-auto space-y-3 no-scrollbar">
              {loading ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  Loading visitors...
                </div>
              ) : visitors.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No visitors recorded yet today.
                </div>
              ) : (
                visitors.map((visitor) => (
                  <div
                    key={visitor.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {visitor.avatar_url ? (
                        <img
                          src={visitor.avatar_url}
                          alt={visitor.display_name || "Visitor"}
                          className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300">
                          {(visitor.display_name || "A").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-neutral-200 truncate max-w-35">
                        {visitor.display_name || "Anonymous Reader"}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                      {formatRelativeTime(visitor.visited_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}