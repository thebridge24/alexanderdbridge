import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const surveyId = new URL(request.url).searchParams.get("surveyId");
    const supabase = createSupabaseAdmin();

    let query = supabase
      .from("survey_responses")
      .select("*")
      .order("created_at", { ascending: false });
    if (surveyId) query = query.eq("survey_id", surveyId);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      submissions: (data ?? []).map((r) => ({
        id: r.id,
        userName: r.user_name ?? undefined,
        userEmail: r.user_email ?? undefined,
        submittedAt: r.created_at,
        overallRating: r.overall_rating ?? 0,
        answers: r.answers,
      })),
    });
  } catch (err) {
    console.error("Failed to load survey responses:", err);
    return NextResponse.json({ error: "Failed to load surveys" }, { status: 500 });
  }
}
