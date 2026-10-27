"use client";

import React, { useEffect, useRef } from "react";

interface AudioSpectrumProps {
  analyserNode?: AnalyserNode | null;
  isRecording?: boolean;
  className?: string;
}

export function AudioSpectrum({ analyserNode, isRecording, className = "" }: AudioSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !analyserNode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = Math.max(1, (canvas.width / bufferLength) * 0.8);
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = Math.max(4, percent * canvas.height * (isRecording ? 1 : 0.2));

        ctx.fillStyle = isRecording ? "#ef4444" : "rgba(239, 68, 68, 0.4)";
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isRecording]);

  return (
    <div className={`w-full h-24 flex items-center justify-center bg-neutral-900/80 rounded-2xl border border-neutral-800 p-2 overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className="w-full h-full object-contain"
      />
    </div>
  );
}