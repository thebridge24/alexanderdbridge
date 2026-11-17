"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from "react";
import { FaHeart, FaRegHeart, FaRegComment, FaRedoAlt, FaBookOpen } from "react-icons/fa";
import { IoPlay, IoPause, IoArrowBack, IoClose } from "react-icons/io5";
import { FiHeadphones, FiHeart as FiSupportHeart } from "react-icons/fi";
import Link from "next/link";
import PushNotifications from "@/app/api/notifications/PushNotifications";

interface AudioDevotionalScreenProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds?: number;
  /** Anchor scripture for the devotional, shown by the Bible button */
  scripture?: { reference: string; verse: string };
  liked: boolean;
  likeCount: number;
  /** Total plays by everyone so far */
  plays: number;
  commentCount: number;
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
  scripture,
  liked,
  likeCount,
  plays: initialPlays,
  commentCount,
  onLike,
  onComment,
  onPlayRequest,
}: AudioDevotionalScreenProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [repeat, setRepeat] = useState(false);
  const [plays, setPlays] = useState(initialPlays);
  const [showScripture, setShowScripture] = useState(false);

  useEffect(() => {
    setPlays(initialPlays);
  }, [initialPlays]);

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
    setPlays((p) => p + 1);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  return (
    // Very high so the player sits above the header, the nav bar and the sheets
    <div className="fixed inset-0 z-[9999999] bg-black text-white overflow-hidden">
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
        onEmptied={() => {
          setDuration(durationSeconds);
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Bible text sheet */}
      {showScripture && scripture && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-neutral-950 border-t border-neutral-800 rounded-t-3xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-sky-400">{scripture.reference}</span>
            <button
              type="button"
              onClick={() => setShowScripture(false)}
              aria-label="Close Bible text"
              className="size-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
            >
              <IoClose className="size-4" />
            </button>
          </div>
          <p className="text-base leading-relaxed text-neutral-100">{scripture.verse}</p>
        </div>
      )}

      <div className="relative h-full flex flex-col items-center justify-between px-6 py-8 max-w-md mx-auto">
        {/* Top bar: back, logo, Support and notifications (same as the page header) */}
        <div className="w-full flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Go back"
            className="size-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <IoArrowBack className="size-5" />
          </button>

          <img src={coverUrl} alt="Bridge logo" className="size-10 rounded-full object-cover bg-white" />

          <div className="flex items-center gap-2">
            <Link
              href="/support"
              className="flex items-center gap-1.5 px-3 h-11 rounded-full bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs shadow-lg shadow-red-950/50"
            >
              <FiSupportHeart className="size-3.5 fill-current" />
              <span>Support</span>
            </Link>
            <PushNotifications />
          </div>
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
          <div className="flex items-start justify-center gap-5 text-[11px] font-mono">
            {/* Bible: the devotional's anchor scripture (blue) */}
            <button
              type="button"
              onClick={() => setShowScripture(true)}
              aria-label="Bible text"
              className="flex flex-col items-center gap-1 text-sky-400 cursor-pointer active:scale-90 transition-transform"
            >
              <FaBookOpen className="size-5" />
              <span>Bible</span>
            </button>

            <button
              type="button"
              onClick={onLike}
              aria-label="Like"
              className={`flex flex-col items-center gap-1 cursor-pointer active:scale-90 transition-transform ${
                liked ? "text-[#ff0000]" : "text-neutral-300"
              }`}
            >
              {liked ? <FaHeart className="size-5" /> : <FaRegHeart className="size-5" />}
              <span>{likeCount}</span>
            </button>

            {/* Plays: headset icon with the number of plays (green) */}
            <div className="flex flex-col items-center gap-1 text-emerald-400" aria-label="Plays">
              <FiHeadphones className="size-5" />
              <span>{plays}</span>
            </div>

            {/* Comments: count, or the word when there are none (pink) */}
            <button
              type="button"
              onClick={onComment}
              aria-label="Comments"
              className="flex flex-col items-center gap-1 text-pink-400 cursor-pointer active:scale-90 transition-transform"
            >
              <FaRegComment className="size-5" />
              <span>{commentCount > 0 ? commentCount : "comments"}</span>
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
              <FaRedoAlt className="size-4" />
              <span>{repeat ? "On" : "Repeat"}</span>
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
