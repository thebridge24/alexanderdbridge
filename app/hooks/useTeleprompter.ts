"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type TeleprompterFontSize = "sm" | "md" | "lg" | "xl";

export function useTeleprompter(initialText: string = "") {
  const [scriptText, setScriptText] = useState(initialText);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // Supports fractional speeds like 0.25, 0.5, 1, 2...
  const [fontSize, setFontSize] = useState<TeleprompterFontSize>("lg");
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startScrolling = useCallback(() => setIsScrolling(true), []);
  const pauseScrolling = useCallback(() => {
    setIsScrolling(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, []);
  const toggleScrolling = useCallback(() => setIsScrolling((prev) => !prev), []);

  const resetScroll = useCallback(() => {
    setIsScrolling(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (!isScrolling) return;

    const scrollStep = () => {
      if (containerRef.current) {
        // Multiplier adjusted for ultra-smooth slow speeds (0.25x to 4x)
        containerRef.current.scrollTop += scrollSpeed * 0.35;
        if (
          containerRef.current.scrollTop + containerRef.current.clientHeight >=
          containerRef.current.scrollHeight
        ) {
          setIsScrolling(false);
          return;
        }
      }
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  return {
    scriptText,
    setScriptText,
    isScrolling,
    scrollSpeed,
    setScrollSpeed,
    fontSize,
    setFontSize,
    containerRef,
    startScrolling,
    pauseScrolling,
    toggleScrolling,
    resetScroll,
  };
}