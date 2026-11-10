import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { isValidDevotionalDate } from "@/lib/utils/date";

// The recording for a devotional, if there is one (public)
export async function GET(_request: NextRequest, context: { params: Promise<{ date: string }> }) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("devotional_audio")
    .select("audio_url, duration_seconds")
    .eq("date_string", date)
    .maybeSingle();

  return NextResponse.json(
    { audioUrl: data?.audio_url ?? null, durationSeconds: data?.duration_seconds ?? 0 },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
