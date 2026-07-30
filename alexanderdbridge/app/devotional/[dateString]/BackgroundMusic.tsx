"use client";

import { useState, useEffect, useRef } from "react";
import { IoVolumeHighOutline, IoVolumeMuteOutline } from "react-icons/io5";

interface BackgroundMusicProps {
  /** Path to your audio file in public directory */
  audioSrc?: string;
}

export default function BackgroundMusic({
  audioSrc = "/audio/videoplayback (1).m4a",
}: BackgroundMusicProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.25;

    // Attempt autoplay immediately
    const startAudio = async () => {
      try {
        await audio.play();
      } catch {
        // Autoplay blocked — set muted state initially so user can enable it with one tap
        setIsMuted(true);
        audio.muted = true;
      }
    };

    startAudio();
  }, [audioSrc]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // If it was blocked from playing initially, start playback now
      audio.muted = false;
      setIsMuted(false);
      audio.play().catch((err) => console.log("Playback error:", err));
    } else {
      // Toggle purely the muted property, keeping the single audio element running
      const nextMuteState = !audio.muted;
      audio.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  return (
    <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl z-50">
      {/* Hidden audio element bound to audioRef guarantees only ONE audio instance ever exists */}
      <audio ref={audioRef} src={audioSrc} loop playsInline preload="auto" />

      <button
        type="button"
        onClick={toggleMute}
        className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
        aria-label={isMuted ? "Unmute background music" : "Mute background music"}
      >
        {isMuted ? (
          <IoVolumeMuteOutline className="w-5 h-5 text-neutral-400" />
        ) : (
          <IoVolumeHighOutline className="w-5 h-5 text-white animate-pulse" />
        )}
      </button>
    </div>
  );
}