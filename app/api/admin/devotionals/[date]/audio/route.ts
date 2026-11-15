import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { isValidDevotionalDate } from "@/lib/utils/date";
import { getSignedInUserId, isAdminUserId } from "@/lib/audio/access";

const BUCKET = "devotional-audio";
const MAX_BYTES = 25 * 1024 * 1024;
const AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a",
  "audio/mpeg": "mp3", "audio/wav": "wav", "audio/x-wav": "wav",
};

function uploadFailure(message: string) {
  console.error("Audio storage upload failed:", message);
  return NextResponse.json({ error: "Could not upload the recording to storage. Please retry or check that the devotional-audio bucket exists." }, { status: 500 });
}

async function publishRecording(
  supabase: ReturnType<typeof createSupabaseAdmin>, date: string, path: string, durationSeconds: number,
) {
  const audioUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("devotional_audio").upsert(
    { date_string: date, audio_url: audioUrl, storage_path: path, duration_seconds: durationSeconds, updated_at: new Date().toISOString() },
    { onConflict: "date_string" },
  );
  if (error) {
    console.error("Audio metadata save failed:", error);
    // Never report success for a file that listeners cannot find.
    return NextResponse.json({ error: "The audio file uploaded, but its devotional link could not be saved. Check the devotional_audio table and retry." }, { status: 500 });
  }
  return NextResponse.json({ audioUrl, durationSeconds });
}

// Upload the recording for a devotional. Admins only.
export async function POST(request: NextRequest, context: { params: Promise<{ date: string }> }) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const userId = await getSignedInUserId(request, supabase);
  if (!userId) {
    return NextResponse.json({ error: "Sign in with your admin account to upload recordings." }, { status: 401 });
  }
  if (!isAdminUserId(userId)) {
    return NextResponse.json({ error: "Your account is not authorised to upload recordings. Add your account ID to ADMIN_USER_IDS on the server." }, { status: 403 });
  }

  // Upload bytes straight to Storage. A five-minute recording can exceed the
  // host's request-body limit even though it fits our 25 MB storage limit.
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json().catch(() => null);
    const type = typeof body?.contentType === "string" ? body.contentType.split(";")[0].trim().toLowerCase() : "";
    if (!AUDIO_TYPES[type] || !Number.isFinite(body?.size) || body.size <= 0 || body.size > MAX_BYTES) {
      return NextResponse.json({ error: "Choose a supported audio recording of up to 25 MB." }, { status: 400 });
    }
    const path = `${date}/${userId}/${crypto.randomUUID()}.${AUDIO_TYPES[type]}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return uploadFailure(error.message);
    return NextResponse.json({ storagePath: path, uploadToken: data.token, bucket: BUCKET });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const rawDuration = Number(form?.get("durationSeconds"));
  const durationSeconds = Number.isFinite(rawDuration) ? Math.max(0, Math.round(rawDuration)) : 0;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an audio file to upload" }, { status: 400 });
  }
  const extension = AUDIO_TYPES[file.type.split(";")[0].trim().toLowerCase()];
  if (!extension || file.size === 0) {
    return NextResponse.json({ error: "The file must be an audio recording" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording is too large (25 MB max)" }, { status: 400 });
  }

  const path = `${date}/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return uploadFailure(uploadError.message);

  return publishRecording(supabase, date, path, durationSeconds);
}

// Confirm the object exists before publishing its link. Caller must own this upload path.
export async function PUT(request: NextRequest, context: { params: Promise<{ date: string }> }) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;
  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  const supabase = createSupabaseAdmin();
  const userId = await getSignedInUserId(request, supabase);
  if (!userId || !isAdminUserId(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const path = typeof body?.storagePath === "string" ? body.storagePath : "";
  const fileName = path.slice(`${date}/${userId}/`.length);
  if (!path.startsWith(`${date}/${userId}/`) || !/^[\da-f-]{36}\.(webm|ogg|m4a|mp3|wav)$/i.test(fileName)) {
    return NextResponse.json({ error: "Invalid recording path" }, { status: 400 });
  }
  const durationSeconds = Number(body?.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 3600) {
    return NextResponse.json({ error: "Invalid recording duration" }, { status: 400 });
  }
  const { data: file, error } = await supabase.storage.from(BUCKET).info(path);
  if (error || !file) return NextResponse.json({ error: "The recording has not finished uploading. Please retry." }, { status: 409 });
  if (!file.size || file.size > MAX_BYTES || !file.contentType?.startsWith("audio/")) {
    return NextResponse.json({ error: "The uploaded file must be an audio recording of up to 25 MB." }, { status: 400 });
  }

  return publishRecording(supabase, date, path, Math.round(durationSeconds));
}
