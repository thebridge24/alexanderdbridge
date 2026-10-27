"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AudioRecorderState } from "../types/audioDevotional";

const MAX_RECORDING_SECONDS = 300; // 5 Minutes max

export function useAudioRecorder() {
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    state: "idle",
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    permissionGranted: false,
  });

  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAnalyserNode(null);
  }, []);

  const requestMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio Context for Analyser
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // Configured cleanly here
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      setAnalyserNode(analyser);

      setRecorderState((prev) => ({
        ...prev,
        permissionGranted: true,
        error: null,
      }));
      return { stream, analyser };
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Microphone access denied.";
      setRecorderState((prev) => ({
        ...prev,
        permissionGranted: false,
        error: msg,
      }));
      return null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const setup = await requestMicrophone();
    if (!setup) return;

    audioChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(setup.stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);
      setRecorderState((prev) => ({
        ...prev,
        state: "stopped",
        audioBlob,
        audioUrl,
      }));
    };

    mediaRecorder.start(100);
    setRecorderState((prev) => ({
      ...prev,
      state: "recording",
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    }));

    clearTimer();
    timerRef.current = setInterval(() => {
      setRecorderState((prev) => {
        if (prev.duration >= MAX_RECORDING_SECONDS - 1) {
          mediaRecorder.stop();
          clearTimer();
          stopStream();
          return { ...prev, duration: MAX_RECORDING_SECONDS, state: "stopped" };
        }
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);
  }, [requestMicrophone, clearTimer, stopStream]);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      clearTimer();
      setRecorderState((prev) => ({ ...prev, state: "paused" }));
    }
  }, [clearTimer]);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setRecorderState((prev) => ({ ...prev, state: "recording" }));

      clearTimer();
      timerRef.current = setInterval(() => {
        setRecorderState((prev) => {
          if (prev.duration >= MAX_RECORDING_SECONDS - 1) {
            mediaRecorderRef.current?.stop();
            clearTimer();
            stopStream();
            return {
              ...prev,
              duration: MAX_RECORDING_SECONDS,
              state: "stopped",
            };
          }
          return { ...prev, duration: prev.duration + 1 };
        });
      }, 1000);
    }
  }, [clearTimer, stopStream]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      clearTimer();
      stopStream();
    }
  }, [clearTimer, stopStream]);

  const resetRecording = useCallback(() => {
    clearTimer();
    stopStream();
    if (recorderState.audioUrl) {
      URL.revokeObjectURL(recorderState.audioUrl);
    }
    setRecorderState({
      state: "idle",
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      permissionGranted: false,
    });
  }, [clearTimer, stopStream, recorderState.audioUrl]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopStream();
    };
  }, [clearTimer, stopStream]);

  return {
    ...recorderState,
    analyserNode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    maxDuration: MAX_RECORDING_SECONDS,
  };
}