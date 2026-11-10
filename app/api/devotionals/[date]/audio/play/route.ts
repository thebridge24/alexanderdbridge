import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { isValidDevotionalDate } from "@/lib/utils/date";
import { FREE_AUDIO_PLAYS, getSignedInUserId, hasPaidPlan } from "@/lib/audio/access";

// Called before each new play. Counts the play, or refuses it once a free listener is out of plays.
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
    return NextResponse.json({ error: "Sign in to listen", signInRequired: true }, { status: 401 });
  }

  if (await hasPaidPlan(supabase, userId)) {
    return NextResponse.json({ allowed: true, unlimited: true });
  }

  const { data: row, error: readError } = await supabase
    .from("devotional_audio_plays")
    .select("play_count")
    .eq("user_id", userId)
    .eq("date_string", date)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const plays = row?.play_count ?? 0;
  if (plays >= FREE_AUDIO_PLAYS) {
    return NextResponse.json(
      {
        allowed: false,
        limitReached: true,
        plays,
        error: `You have used your ${FREE_AUDIO_PLAYS} free plays. Subscribe to the Reader plan to keep listening.`,
      },
      { status: 403 },
    );
  }

  const { error: writeError } = await supabase
    .from("devotional_audio_plays")
    .upsert({ user_id: userId, date_string: date, play_count: plays + 1 }, { onConflict: "user_id,date_string" });
  if (writeError) return NextResponse.json({ error: writeError.message }, { status: 500 });

  return NextResponse.json({ allowed: true, plays: plays + 1, remaining: FREE_AUDIO_PLAYS - (plays + 1) });
}
