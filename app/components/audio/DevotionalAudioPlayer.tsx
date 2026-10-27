"use client";

import React, { useState, useRef, useEffect } from "react";
import { IoPlay, IoPause } from "react-icons/io5";

interface DevotionalAudioPlayerProps {
  audioUrl: string;
  durationSeconds?: number;
  onAudioComplete?: () => void;
}

export function DevotionalAudioPlayer({
  audioUrl,
  durationSeconds = 0,
  onAudioComplete,
}: DevotionalAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredStreak = useRef(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || duration;

    setCurrentTime(current);

    // Trigger streak completion when >= 90% listened
    if (total > 0 && current / total >= 0.9 && !hasTriggeredStreak.current) {
      hasTriggeredStreak.current = true;
      if (onAudioComplete) {
        onAudioComplete();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  useEffect(() => {
    hasTriggeredStreak.current = false;
  }, [audioUrl]);

  return (
    <div className="w-full p-4 rounded-3xl bg-neutral-950 border border-neutral-800 backdrop-blur-xl flex flex-col gap-3 my-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onAudioComplete && !hasTriggeredStreak.current) {
            hasTriggeredStreak.current = true;
            onAudioComplete();
          }
        }}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="size-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          {isPlaying ? <IoPause className="size-5" /> : <IoPlay className="size-5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-neutral-800 accent-red-600 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[10px] font-mono text-neutral-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}