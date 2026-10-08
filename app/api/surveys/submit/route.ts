import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    const surveyId = typeof body?.surveyId === "string" ? body.surveyId.trim() : "";
    const answers = body?.answers;
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : null;

    if (!surveyId || !answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "surveyId and answers are required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Attach the signed-in user when a bearer token is supplied.
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = typeof body?.userName === "string" ? body.userName : null;
    if (accessToken) {
      const { data } = await supabase.auth.getUser(accessToken);
      if (data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
        userName =
          userName ??
          (data.user.user_metadata?.full_name as string | undefined) ??
          null;
      }
    }

    // Fallback email and name from survey answer fields if anonymous
    if (!userEmail && typeof answers.email === "string" && answers.email.includes("@")) {
      userEmail = answers.email.trim().toLowerCase();
    }
    if (!userName && typeof answers.name === "string" && answers.name.trim().length > 0) {
      userName = answers.name.trim();
    }

    const rating = Number(answers.rating_overall);


    const { error } = await supabase.from("survey_responses").insert({
      survey_id: surveyId,
      user_id: userId,
      session_id: sessionId,
      user_name: userName,
      user_email: userEmail,
      overall_rating: Number.isFinite(rating) ? rating : null,
      answers,
    });

    if (error) {
      console.error("Error saving survey response:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Survey submit failed:", err);
    return NextResponse.json({ error: "Failed to submit survey" }, { status: 500 });
  }
}
