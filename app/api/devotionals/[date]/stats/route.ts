import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isValidDevotionalDate } from "@/lib/utils/date";

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  const supabase = createSupabaseAdmin();

  const [viewsResult, likesResult, likedResult] = await Promise.all([
    supabase
      .from("devotional_views")
      .select("view_count")
      .eq("devotional_date", date)
      .maybeSingle(),
    supabase
      .from("devotional_likes")
      .select("like_count")
      .eq("devotional_date", date)
      .maybeSingle(),
    sessionId
      ? supabase
          .from("devotional_like_sessions")
          .select("session_id")
          .eq("devotional_date", date)
          .eq("session_id", sessionId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (viewsResult.error || likesResult.error || likedResult.error) {
    const message =
      viewsResult.error?.message ??
      likesResult.error?.message ??
      likedResult.error?.message ??
      "Failed to load stats";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    {
      viewCount: viewsResult.data?.view_count ?? 0,
      likeCount: likesResult.data?.like_count ?? 0,
      liked: Boolean(likedResult.data),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
