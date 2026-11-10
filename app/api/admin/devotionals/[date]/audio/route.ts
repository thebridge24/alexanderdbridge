import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { isValidDevotionalDate } from "@/lib/utils/date";
import { getSignedInUserId, isAdminUserId } from "@/lib/audio/access";

const BUCKET = "devotional-audio";
const MAX_BYTES = 25 * 1024 * 1024;

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
  if (!userId || !isAdminUserId(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const durationSeconds = Math.max(0, Math.round(Number(form?.get("durationSeconds")) || 0));
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an audio file to upload" }, { status: 400 });
  }
  if (!file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "The file must be an audio recording" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Recording is too large (25 MB max)" }, { status: 400 });
  }

  const extension = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
  const path = `${date}/${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const audioUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: saveError } = await supabase
    .from("devotional_audio")
    .upsert(
      { date_string: date, audio_url: audioUrl, storage_path: path, duration_seconds: durationSeconds, updated_at: new Date().toISOString() },
      { onConflict: "date_string" },
    );
  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 });

  return NextResponse.json({ audioUrl, durationSeconds });
}
