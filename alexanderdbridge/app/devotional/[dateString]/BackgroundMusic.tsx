"use client";

import { useState, useEffect, useRef } from "react";
import { IoVolumeHighOutline, IoVolumeMuteOutline } from "react-icons/io5";

interface BackgroundMusicProps {
  /** Path to your audio file in public directory (e.g. "/audio/ambient.mp3") */
  audioSrc?: string;
}

export default function BackgroundMusic({
  audioSrc = "/audio/videoplayback (1).m4a",
}: BackgroundMusicProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.25; // Keep it subtle for background reading (25% volume)
    audioRef.current = audio;

    // Attempt autoplay
    const playAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked by browser rules - wait for first user interaction
        const handleFirstInteraction = () => {
          audio.play().then(() => {
            setIsPlaying(true);
          }).catch(() => {});
          window.removeEventListener("click", handleFirstInteraction);
          window.removeEventListener("touchstart", handleFirstInteraction);
        };

        window.addEventListener("click", handleFirstInteraction);
        window.addEventListener("touchstart", handleFirstInteraction);
      }
    };

    playAudio();

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioSrc]);

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      } else {
        audioRef.current.muted = true;
        setIsMuted(true);
      }
    } else {
      // If paused due to browser policies, resume playback on click
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        audioRef.current!.muted = false;
        setIsMuted(false);
      });
    }
  };

  return (
    <div className="p-0.5 rounded-full bg-white/5 backdrop-blur-md border border-neutral-800/80 shadow-2xl z-50">
      <button
        onClick={toggleMute}
        className="w-11 h-11 flex items-center justify-center rounded-full text-neutral-300 hover:text-white bg-transparent hover:bg-neutral-800/80 active:scale-90 transition-all"
        aria-label={isMuted ? "Unmute background music" : "Mute background music"}
      >
        {isMuted || !isPlaying ? (
          <IoVolumeMuteOutline className="w-5 h-5 text-neutral-400" />
        ) : (
          <IoVolumeHighOutline className="w-5 h-5 text-white animate-pulse" />
        )}
      </button>
    </div>
  );
}