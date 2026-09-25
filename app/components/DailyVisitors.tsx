/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoEyeOutline } from 'react-icons/io5';
import { MdVerified } from 'react-icons/md';

interface Visitor {
  id: string;
  display_name: string;
  email?: string;
  avatar_url: string;
  visited_at: string;
}

interface DailyVisitorsProps {
  devotionalDate: string;
}

// Helper function to check if the visitor email is verified
const isVerifiedUser = (email?: string): boolean => {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  const VERIFIED_EMAILS = [
    'alexanderchrist203@gmail.com',
    'alexanderdbridge@gmail.com',
  ];

  return VERIFIED_EMAILS.includes(cleanEmail);
};

function VisitorAvatar({ visitor }: { visitor: Visitor }) {
  const [imgError, setImgError] = useState(false);
  const initial = visitor.display_name ? visitor.display_name.charAt(0).toUpperCase() : '?';

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  };

  const name = visitor.display_name || 'Believer';
  const isVerified = isVerifiedUser(visitor.email);

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
        {visitor.avatar_url && !imgError ? (
          <img
            src={visitor.avatar_url}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-xs font-bold text-neutral-300">
            {initial}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <p className="text-xs font-semibold text-neutral-200 truncate">{name}</p>
          {isVerified && (
            <MdVerified
              className="w-3.5 h-3.5 text-blue-500 shrink-0 inline-block"
              title="Verified User"
            />
          )}
        </div>
        <p className="text-[10px] text-neutral-500">{formatTime(visitor.visited_at)}</p>
      </div>
    </div>
  );
}

function StackedAvatar({ visitor }: { visitor: Visitor }) {
  const [err, setErr] = useState(false);
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-black bg-neutral-800 shrink-0">
      {visitor.avatar_url && !err ? (
        <img
          src={visitor.avatar_url}
          alt={visitor.display_name}
          referrerPolicy="no-referrer"
          onError={() => setErr(true)}
          className="size-full object-cover"
        />
      ) : (
        <div className="size-full flex items-center justify-center text-[9px] font-bold text-neutral-300">
          {visitor.display_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

export default function DailyVisitors({ devotionalDate }: DailyVisitorsProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!devotionalDate) return;
    setLoading(true);
    fetch(`/api/devotionals/${devotionalDate}/visitors`)
      .then((r) => (r.ok ? r.json() : { visitors: [] }))
      .then((data) => setVisitors(data.visitors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [devotionalDate]);

  if (visitors.length === 0 && !loading) return null;

  return (
    <div className="relative">
      {/* Stacked Avatar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 group cursor-pointer"
        aria-label="Show today's visitors"
      >
        <div className="flex -space-x-2">
          {visitors.slice(0, 5).map((v) => (
            <StackedAvatar key={v.id} visitor={v} />
          ))}
          {visitors.length > 5 && (
            <div className="flex items-center justify-center text-xs font-bold text-neutral-300 ml-4">
              +{visitors.length - 5} others
            </div>
          )}
        </div>
      </button>

      {/* Slide-down panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute left-0 mt-3 w-64 rounded-3xl bg-neutral-950/95 border border-neutral-800 backdrop-blur-2xl p-4 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IoEyeOutline className="size-3.5 text-neutral-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  {visitors.length} {visitors.length === 1 ? 'view' : 'views'} Today
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <IoClose className="size-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto no-scrollbar">
              {visitors.map((v) => (
                <VisitorAvatar key={v.id} visitor={v} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}