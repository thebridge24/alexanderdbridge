"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Volume2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface VideoItem {
  id: string;
  videoUrl: string;
  title?: string;
}

interface FloatingVideoPlayerProps {
  /** Array of video items. The latest or active unviewed video will be played. */
  videos: VideoItem[];
}

export default function FloatingVideoPlayer({ videos = [] }: FloatingVideoPlayerProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("0:00");
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

  // Get the active/latest video
  const activeVideo = videos[videos.length - 1];

  // 1. Check if user is logged in via Supabase session
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Derive whether active video is fully viewed without synchronous effect setState triggers
  const isFullyViewed = (() => {
    if (!activeVideo || typeof window === "undefined") return false;
    const viewedKey = `bridge_video_viewed_${activeVideo.id}`;
    return localStorage.getItem(viewedKey) === "true";
  })();

  const [, forceUpdate] = useState({});

  // Format seconds into M:SS remaining countdown
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle time updates for the expanded video
  const handleTimeUpdate = () => {
    const vid = expandedVideoRef.current;
    if (!vid) return;

    const current = vid.currentTime;
    const duration = vid.duration;
    if (duration) {
      const remaining = duration - current;
      setTimeLeft(formatTime(remaining));
      setProgress((current / duration) * 100);

      // If user finishes watching the video
      if (current >= duration - 0.5) {
        if (activeVideo) {
          localStorage.setItem(`bridge_video_viewed_${activeVideo.id}`, "true");
          setIsExpanded(false);
          forceUpdate({}); // Trigger re-render to hide player
        }
      }
    }
  };

  // Toggle expand/minimize
  const handleExpand = () => {
    setIsExpanded(true);
    setIsPlaying(true);
    if (expandedVideoRef.current) {
      expandedVideoRef.current.currentTime = 0; // Restart from beginning
      expandedVideoRef.current.muted = false; // Unmute
      expandedVideoRef.current.play().catch(() => {});
    }
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    if (expandedVideoRef.current) {
      expandedVideoRef.current.pause();
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = expandedVideoRef.current;
    if (!vid) return;

    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      vid.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Hide if user is not logged in, no active video, or video is fully viewed
  if (!userId || !activeVideo || isFullyViewed) return null;

  return (
    <>
      {/* 1. Floating Mini Video Widget (Fixed at bottom-12 left-4 / left-6) */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={handleExpand}
          className="fixed bottom-12 left-4 sm:left-6 z-50 w-32 sm:w-40 aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black cursor-pointer pointer-events-auto group transition-transform hover:scale-105"
        >
          <video
            ref={videoRef}
            src={activeVideo.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover pointer-events-none"
          />
          
          {/* Subtle live indicator & expand prompt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
            <div className="flex items-center justify-between text-[10px] text-white font-mono">
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                WATCH
              </span>
              <Volume2 className="w-3 h-3 text-white/70" />
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Expanded Center Screen Modal */}
      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-hidden">
            
            {/* Top-Left Cancel / Minimize Button */}
            <button
              onClick={handleMinimize}
              aria-label="Close video"
              className="absolute top-6 left-6 z-50 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-white shadow-2xl transition-all cursor-pointer flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Expanded Video Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] max-h-[80vh] rounded-[28px] overflow-hidden shadow-2xl bg-neutral-950 border border-white/15 flex flex-col justify-between"
            >
              {/* Video Element */}
              <video
                ref={expandedVideoRef}
                src={activeVideo.videoUrl}
                autoPlay
                playsInline
                onTimeUpdate={handleTimeUpdate}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Dark Gradient Overlay - Top (Timer) */}
              <div className="relative z-10 w-full p-4 bg-gradient-to-b from-black/70 via-black/25 to-transparent flex items-center justify-center">
                <div className="px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-xs font-mono text-white tracking-widest">
                  {timeLeft} remaining
                </div>
              </div>

              {/* Dark Gradient Overlay - Bottom (Controls & Progress Bar) */}
              <div className="relative z-10 w-full p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col gap-3">
                
                {/* Progress bar */}
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Control bar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white/90 truncate max-w-[200px]">
                    {activeVideo.title || "Daily Devotional Message"}
                  </span>

                  <button
                    onClick={togglePlayPause}
                    className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}