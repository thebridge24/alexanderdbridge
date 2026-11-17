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
  const { data, error } = await supabase
    .from("devotional_audio")
    .select("audio_url, duration_seconds")
    .eq("date_string", date)
    .maybeSingle();

  if (error) {
    console.error("Could not load devotional audio:", error);
    return NextResponse.json({ error: "Could not load the recording. Please try again." }, { status: 500 });
  }

  // Total plays across everyone (a person's repeat plays count each time)
  const { data: playRows } = await supabase
    .from("devotional_audio_plays")
    .select("play_count")
    .eq("date_string", date);
  const totalPlays = (playRows ?? []).reduce((sum, row) => sum + (row.play_count ?? 0), 0);

  return NextResponse.json(
    { audioUrl: data?.audio_url ?? null, durationSeconds: data?.duration_seconds ?? 0, totalPlays },
    { headers: { "Cache-Control": "no-store" } },
  );
}
