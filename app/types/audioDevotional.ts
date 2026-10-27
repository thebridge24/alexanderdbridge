export interface DevotionalAudioMetadata {
  id?: string;
  devotionalId?: string;
  dateString: string;
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  fileSizeBytes: number;
  recordedBy?: string;
  createdAt?: string;
  scriptText?: string;
}

export type RecordingState = "idle" | "recording" | "paused" | "stopped" | "uploading";

export interface AudioRecorderState {
  state: RecordingState;
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  permissionGranted: boolean;
}

export interface AudioUploadResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
  metadata?: DevotionalAudioMetadata;
}