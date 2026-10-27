"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoMic, IoPause, IoPlay, IoSquare, IoTrash, IoCheckmark } from "react-icons/io5";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { useAudioRecorder } from "@/app/hooks/useAudioRecorder";
import { useTeleprompter, TeleprompterFontSize } from "@/app/hooks/useTeleprompter";
import { AudioSpectrum } from "./AudioSpectrum";
import { Check, Pencil } from "lucide-react";
import { formatDate } from "@/lib/format-date";

interface AudioRecordingStudioProps {
  isOpen: boolean;
  onClose: () => void;
  dateString: string;
  initialScript?: string;
  onSaveAudio: (audioBlob: Blob, durationSeconds: number) => Promise<void>;
}

const speeds = [0.25, 0.5, 1, 1.5, 2, 3];

export function AudioRecordingStudio({
  isOpen,
  onClose,
  dateString,
  initialScript = "",
  onSaveAudio,
}: AudioRecordingStudioProps) {
  const {
    state,
    duration,
    audioBlob,
    audioUrl,
    error,
    analyserNode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    maxDuration,
  } = useAudioRecorder();

  const {
    scriptText,
    setScriptText,
    scrollSpeed,
    setScrollSpeed,
    fontSize,
    setFontSize,
    containerRef,
    startScrolling,
    pauseScrolling,
    resetScroll,
  } = useTeleprompter(initialScript);

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingScript, setIsEditingScript] = useState(false);

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleStartBoth = () => {
    startRecording();
    startScrolling();
  };

  const handleSave = async () => {
    if (!audioBlob) return;
    try {
      setIsUploading(true);
      await onSaveAudio(audioBlob, duration);
      resetRecording();
      resetScroll();
      onClose();
    } catch (err) {
      console.error("Failed to save audio:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const cycleSpeed = (direction: "up" | "down") => {
    const currentIndex = speeds.indexOf(scrollSpeed);
    if (direction === "up" && currentIndex < speeds.length - 1) {
      setScrollSpeed(speeds[currentIndex + 1]);
    } else if (direction === "down" && currentIndex > 0) {
      setScrollSpeed(speeds[currentIndex - 1]);
    }
  };

  const fontSizes: TeleprompterFontSize[] = ["sm", "md", "lg", "xl"];
  const cycleFontSize = () => {
    const nextIdx = (fontSizes.indexOf(fontSize) + 1) % fontSizes.length;
    setFontSize(fontSizes[nextIdx]);
  };

  const getFontSizeClass = (size: TeleprompterFontSize) => {
    switch (size) {
      case "sm": return "text-sm";
      case "md": return "text-base";
      case "lg": return "text-lg";
      case "xl": return "text-2xl font-bold";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-9999 bg-black text-white flex flex-col justify-between p-6 overflow-hidden"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-900">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 block">
              Recording Studio
            </span>
            <h2 className="text-sm font-bold text-neutral-200">{formatDate(dateString)}</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              resetRecording();
              resetScroll();
              onClose();
            }}
            className="p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <IoClose className="size-5" />
          </button>
        </div>

        {/* Teleprompter Script Box */}
        <div className="flex-1 my-4 flex flex-col min-h-0 bg-neutral-950 rounded-3xl border border-neutral-900 p-4 relative">
          <div className="flex flex-col mb-2 pb-2 border-b border-neutral-900 gap-2">
            <span className=" font-bold text-neutral-200">Teleprompter</span>
            
            <div className="flex items-center gap-2">
              {/* Slower/Faster Speed Controls */}
              <div className="flex items-center bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800 gap-1.5">
                <button
                  type="button"
                  onClick={() => cycleSpeed("down")}
                  className="text-neutral-400 hover:text-white text-xs"
                  title="Slower"
                >
                  <FaMinus className="size-2.5" />
                </button>
                <span className="text-[10px] font-mono text-red-500 font-bold min-w-8 text-center">{scrollSpeed}x</span>
                <button
                  type="button"
                  onClick={() => cycleSpeed("up")}
                  className="text-neutral-400 hover:text-white text-xs"
                  title="Faster"
                >
                  <FaPlus className="size-2.5" />
                </button>
              </div>

              {/* Font Size Toggle */}
              <button
                type="button"
                onClick={cycleFontSize}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 uppercase cursor-pointer"
                title="Change Font Size"
              >
                Font: {fontSize}
              </button>

              <button
                type="button"
                onClick={() => setIsEditingScript(!isEditingScript)}
                className="flex items-center gap-1 text-xs font-bold text-red-500 hover:underline ml-1 bg-neutral-900 px-2 p-1 rounded-lg border border-neutral-700"
              >
                {isEditingScript ? <Check className="size-3" /> : <Pencil className="size-3" />} {isEditingScript ? "Done": "Edit"}
              </button>
            </div>
          </div>

          {isEditingScript ? (
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Paste or write your devotional script here..."
              className="w-full flex-1 bg-transparent text-sm text-neutral-200 outline-none resize-none"
            />
          ) : (
            <div
              ref={containerRef}
              className={`w-full flex-1 overflow-y-auto no-scrollbar font-medium leading-relaxed text-neutral-300 space-y-4 pr-2 ${getFontSizeClass(
                fontSize
              )}`}
            >
              {scriptText ? (
                <p>{scriptText}</p>
              ) : (
                <p className="text-sm text-neutral-600 italic">
                  No script loaded. Click edit above to paste your devotional text.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Waveform & Countdown Timer */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-bold text-neutral-400">
              <span className="text-white text-lg">{formatTimer(duration)}</span> / {formatTimer(maxDuration)}
            </span>
            {state === "recording" && (
              <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold animate-pulse">
                <span className="size-2 rounded-full bg-red-500" /> Recording Live
              </span>
            )}
          </div>

          <AudioSpectrum analyserNode={analyserNode} isRecording={state === "recording"} />

          {error && <p className="text-xs text-red-400 text-center font-semibold">{error}</p>}
        </div>

        {/* Preview Audio (if stopped) */}
        {state === "stopped" && audioUrl && (
          <div className="mb-4 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <audio src={audioUrl} controls className="w-full h-8" />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-4 pt-2">
          {state === "idle" && (
            <button
              type="button"
              onClick={handleStartBoth}
              className="py-4 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-950/50 active:scale-95 transition-all cursor-pointer"
            >
              <IoMic className="size-6" /> Start
            </button>
          )}

          {state === "recording" && (
            <>
              <button
                type="button"
                onClick={() => {
                  pauseRecording();
                  pauseScrolling();
                }}
                className="p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-all cursor-pointer"
                title="Pause"
              >
                <IoPause className="size-6" />
              </button>

              <button
                type="button"
                onClick={() => {
                  stopRecording();
                  pauseScrolling();
                }}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all cursor-pointer shadow-lg shadow-red-950/50"
                title="Stop"
              >
                <IoSquare className="size-6" />
              </button>
            </>
          )}

          {state === "paused" && (
            <>
              <button
                type="button"
                onClick={() => {
                  resumeRecording();
                  startScrolling();
                }}
                className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold transition-all cursor-pointer"
                title="Resume"
              >
                <IoPlay className="size-6" />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-all cursor-pointer"
                title="Stop"
              >
                <IoSquare className="size-6" />
              </button>
            </>
          )}

          {state === "stopped" && (
            <>
              <button
                type="button"
                onClick={resetRecording}
                className="p-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-red-400 transition-all cursor-pointer"
                title="Discard"
              >
                <IoTrash className="size-5" />
              </button>

              <button
                type="button"
                disabled={isUploading}
                onClick={handleSave}
                className="py-3.5 px-6 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer disabled:opacity-50"
              >
                <IoCheckmark className="size-5" />
                {isUploading ? "Uploading..." : "Save Recording"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}