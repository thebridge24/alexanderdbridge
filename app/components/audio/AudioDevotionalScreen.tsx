"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRedoAlt } from "react-icons/fa";
import { IoClose, IoPlay, IoPause } from "react-icons/io5";

interface AudioDevotionalScreenProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds?: number;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onComment: () => void;
  /** Resolve to false to block a new play (plays used up, or not signed in) */
  onPlayRequest: () => Promise<boolean>;
}

const formatTime = (secs: number) => {
  const safe = Number.isFinite(secs) ? secs : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, "0")}`;
};

/** Full-screen audio devotional: the cover spins while playing, and no text is shown. */
export function AudioDevotionalScreen({
  isOpen,
  onClose,
  title,
  coverUrl,
  audioUrl,
  durationSeconds = 0,
  liked,
  likeCount,
  onLike,
  onComment,
  onPlayRequest,
}: AudioDevotionalScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [repeat, setRepeat] = useState(false);

  // Keep the repeat setting on the audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat;
  }, [repeat]);

  // Stop playback when the screen closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    // Each start from paused counts as one play
    if (!(await onPlayRequest())) return;
    audio.play();
    setIsPlaying(true);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  return (
    <div className="fixed inset-0 z-10000 bg-black text-white overflow-hidden">
      {/* Blurred cover behind everything */}
      <img
        src={coverUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover scale-110 blur-3xl opacity-40"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/80 to-black" />

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="relative h-full flex flex-col items-center justify-between px-6 py-8 max-w-md mx-auto">
        <div className="w-full flex justify-start">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close audio devotional"
            className="size-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <IoClose className="size-5" />
          </button>
        </div>

        {/* Spinning cover */}
        <div className="flex flex-col items-center gap-6 w-full">
          <div
            className="size-64 rounded-full overflow-hidden border-8 border-neutral-900 shadow-2xl shadow-red-950/40 animate-spin"
            style={{
              animationDuration: "14s",
              animationPlayState: isPlaying ? "running" : "paused",
            }}
          >
            <img src={coverUrl} alt={title} className="size-full object-cover" />
          </div>

          <h2 className="text-xl font-bold text-center leading-snug">{title}</h2>

          {/* Progress */}
          <div className="w-full space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={seek}
              aria-label="Seek"
              className="w-full h-1.5 bg-neutral-800 accent-red-600 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-neutral-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-8">
          <div className="flex items-center justify-center gap-10">
            <button
              type="button"
              onClick={onLike}
              aria-label="Like"
              className={`flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform ${
                liked ? "text-[#ff0000]" : "text-neutral-300"
              }`}
            >
              {liked ? <FaHeart className="size-6" /> : <FaRegHeart className="size-6" />}
              <span className="text-[11px] font-mono">{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={onComment}
              aria-label="Comments"
              className="flex flex-col items-center gap-1 text-neutral-300 cursor-pointer active:scale-90 transition-transform"
            >
              <FaRegComment className="size-6" />
              <span className="text-[11px] font-mono">Comment</span>
            </button>

            <button
              type="button"
              onClick={() => setRepeat((r) => !r)}
              aria-label="Repeat"
              aria-pressed={repeat}
              className={`flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform ${
                repeat ? "text-red-500" : "text-neutral-300"
              }`}
            >
              <FaRedoAlt className="size-5" />
              <span className="text-[11px] font-mono">{repeat ? "On" : "Repeat"}</span>
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="size-20 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-xl shadow-red-950/60 active:scale-95 transition-transform cursor-pointer"
            >
              {isPlaying ? <IoPause className="size-8" /> : <IoPlay className="size-8 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
