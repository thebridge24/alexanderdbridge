import { fixWebmDuration } from "@fix-webm-duration/fix";

/** Recover timing for old device drafts, then make new/old WebM files seekable. */
export async function prepareRecording(blob: Blob, durationSeconds: number) {
  let duration = durationSeconds;
  if (!Number.isFinite(duration) || duration <= 0) {
    const context = new AudioContext();
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      duration = decoded.duration;
    } finally {
      await context.close();
    }
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Could not read the recording duration. Please try again.");
  }
  const audio = blob.type.includes("webm")
    ? await fixWebmDuration(blob, duration * 1000, { logger: false })
    : blob;
  return { blob: audio, durationSeconds: Math.max(1, Math.round(duration)) };
}
