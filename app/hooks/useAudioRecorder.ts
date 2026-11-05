
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AudioRecorderState } from "../types/audioDevotional";

// ============================================================
// DATA
// ============================================================

const MAX_RECORDING_SECONDS = 300;

const SUPPORTED_AUDIO_FORMATS = [
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

// ============================================================
// HOOK
// ============================================================

export function useAudioRecorder() {
  // Recording state
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    state: "idle",
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    permissionGranted: false,
  });

  // Audio visualization and recording resources
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const durationRef = useRef(0);
  const audioUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // ============================================================
  // CLEANUP HELPERS
  // ============================================================

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    streamRef.current = null;

    sourceRef.current?.disconnect();
    sourceRef.current = null;

    const context = audioContextRef.current;
    audioContextRef.current = null;

    if (context && context.state !== "closed") {
      void context.close().catch(console.error);
    }

    if (mountedRef.current) {
      setAnalyserNode(null);
      setMediaStream(null);
    }
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  // ============================================================
  // MICROPHONE
  // ============================================================

  const requestMicrophone = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Microphone recording is not supported in this browser.",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Expose the exact same stream to WaveSurfer.
      if (mountedRef.current) {
        setMediaStream(stream);
      }

      // Create audio analyser for other audio processing if needed.
      const AudioCtx =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext: typeof AudioContext;
          }
        ).webkitAudioContext;

      const audioCtx = new AudioCtx();

      audioContextRef.current = audioCtx;

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.75;

      const source = audioCtx.createMediaStreamSource(stream);

      source.connect(analyser);

      sourceRef.current = source;

      if (mountedRef.current) {
        setAnalyserNode(analyser);

        setRecorderState((prev) => ({
          ...prev,
          permissionGranted: true,
          error: null,
        }));
      }

      return { stream, analyser };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Microphone access denied.";

      stopStream();

      if (mountedRef.current) {
        setRecorderState((prev) => ({
          ...prev,
          permissionGranted: false,
          error: message,
        }));
      }

      return null;
    }
  }, [stopStream]);

  // ============================================================
  // RECORDING CONTROL
  // ============================================================

  const finishRecording = useCallback(() => {
    clearTimer();

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      stopStream();
    }
  }, [clearTimer, stopStream]);

  const startTimer = useCallback(() => {
    clearTimer();

    timerRef.current = setInterval(() => {
      durationRef.current += 1;

      const nextDuration = Math.min(
        durationRef.current,
        MAX_RECORDING_SECONDS,
      );

      if (mountedRef.current) {
        setRecorderState((prev) => ({
          ...prev,
          duration: nextDuration,
        }));
      }

      if (nextDuration >= MAX_RECORDING_SECONDS) {
        finishRecording();
      }
    }, 1000);
  }, [clearTimer, finishRecording]);

  // ============================================================
  // START RECORDING
  // ============================================================

  const startRecording = useCallback(async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      return;
    }

    const setup = await requestMicrophone();

    if (!setup || !mountedRef.current) {
      return;
    }

    try {
      audioChunksRef.current = [];
      durationRef.current = 0;

      revokeAudioUrl();

      const mimeType = SUPPORTED_AUDIO_FORMATS.find((type) =>
        MediaRecorder.isTypeSupported(type),
      );

      const recorder = new MediaRecorder(
        setup.stream,
        mimeType ? { mimeType } : undefined,
      );

      mediaRecorderRef.current = recorder;

      setMediaRecorder(recorder);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const url = URL.createObjectURL(blob);

        revokeAudioUrl();

        audioUrlRef.current = url;

        stopStream();

        if (mountedRef.current) {
          setMediaRecorder(null);

          setRecorderState((prev) => ({
            ...prev,
            state: "stopped",
            audioBlob: blob,
            audioUrl: url,
            duration: durationRef.current,
          }));
        }

        mediaRecorderRef.current = null;
      };

      recorder.onerror = () => {
        clearTimer();
        stopStream();

        if (mountedRef.current) {
          setMediaRecorder(null);

          setRecorderState((prev) => ({
            ...prev,
            state: "stopped",
            error: "An error occurred while recording audio.",
          }));
        }

        mediaRecorderRef.current = null;
      };

      recorder.start(250);

      setRecorderState((prev) => ({
        ...prev,
        state: "recording",
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));

      startTimer();
    } catch (err: unknown) {
      clearTimer();
      stopStream();

      mediaRecorderRef.current = null;
      setMediaRecorder(null);

      setRecorderState((prev) => ({
        ...prev,
        state: "idle",
        error:
          err instanceof Error ? err.message : "Unable to start recording.",
      }));
    }
  }, [
    requestMicrophone,
    startTimer,
    stopStream,
    clearTimer,
    revokeAudioUrl,
  ]);

  // ============================================================
  // PAUSE RECORDING
  // ============================================================

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.pause();

      clearTimer();

      setRecorderState((prev) => ({
        ...prev,
        state: "paused",
      }));
    }
  }, [clearTimer]);

  // ============================================================
  // RESUME RECORDING
  // ============================================================

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "paused") {
      recorder.resume();

      setRecorderState((prev) => ({
        ...prev,
        state: "recording",
      }));

      startTimer();
    }
  }, [startTimer]);

  // ============================================================
  // STOP RECORDING
  // ============================================================

  const stopRecording = useCallback(() => {
    finishRecording();
  }, [finishRecording]);

  // ============================================================
  // RESET RECORDING
  // ============================================================

  const resetRecording = useCallback(() => {
    clearTimer();

    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }

    mediaRecorderRef.current = null;
    setMediaRecorder(null);

    stopStream();
    revokeAudioUrl();

    audioChunksRef.current = [];
    durationRef.current = 0;

    setRecorderState({
      state: "idle",
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
      permissionGranted: false,
    });
  }, [clearTimer, stopStream, revokeAudioUrl]);

  // ============================================================
  // COMPONENT CLEANUP
  // ============================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      clearTimer();

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.stop();
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      sourceRef.current?.disconnect();
      sourceRef.current = null;

      const context = audioContextRef.current;

      if (context && context.state !== "closed") {
        void context.close().catch(console.error);
      }

      audioContextRef.current = null;

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [clearTimer]);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    ...recorderState,

    analyserNode,
    mediaRecorder,
    mediaStream,

    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,

    maxDuration: MAX_RECORDING_SECONDS,
  };
}
