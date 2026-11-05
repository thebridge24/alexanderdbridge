
"use client";

import React, { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";

interface AudioSpectrumProps {
  mediaStream?: MediaStream | null;
  isRecording?: boolean;
  isPaused?: boolean;
  className?: string;
}

export function AudioSpectrum({
  mediaStream,
  isRecording = false,
  isPaused = false,
  className = "",
}: AudioSpectrumProps) {
  // Data
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const micRendererRef = useRef<{ onDestroy: () => void; onEnd: () => void } | null>(null);

  // Logic
  useEffect(() => {
    const container = containerRef.current;

    if (!container || !mediaStream) return;

    const recordPlugin = RecordPlugin.create({
      renderRecordedAudio: false,
      scrollingWaveform: true,
      scrollingWaveformWindow: 8,
    });

    const wavesurfer = WaveSurfer.create({
      container,
      height: 100,
      waveColor: "#ef4444",
      progressColor: "#dc2626",
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 4,
      normalize: true,
      interact: false,
      hideScrollbar: true,
      plugins: [recordPlugin],
    });

    wavesurferRef.current = wavesurfer;
    recordPluginRef.current = recordPlugin;

    const micRenderer = recordPlugin.renderMicStream(mediaStream);
    micRendererRef.current = micRenderer;

    return () => {
      micRenderer.onDestroy();
      wavesurfer.destroy();

      micRendererRef.current = null;
      wavesurferRef.current = null;
      recordPluginRef.current = null;
    };
  }, [mediaStream]);

  useEffect(() => {
    if (isPaused) {
      recordPluginRef.current?.pauseRecording();
    } else if (isRecording) {
      recordPluginRef.current?.resumeRecording();
    }
  }, [isRecording, isPaused]);

  return (
    <div
      className={`w-full h-28 flex items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 px-3 ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full"
        aria-label="Live microphone waveform"
        role="img"
      />

      {!mediaStream && (
        <span className="absolute text-xs text-neutral-500">
          Your waveform will appear here
        </span>
      )}
    </div>
  );
}
