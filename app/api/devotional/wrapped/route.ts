import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { getMonthlyWrappedData } from "@/app/ib/wrapped/getMonthlyWrapped";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Monthly recap for the signed-in user. The user id always comes from the token,
// so nobody can request another user's statistics.
export async function GET(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentDate = request.nextUrl.searchParams.get("currentDate")?.trim() || undefined;
  if (currentDate && (!DATE_RE.test(currentDate) || Number.isNaN(new Date(currentDate).getTime()))) {
    return NextResponse.json(
      { error: "currentDate must be a valid date in YYYY-MM-DD format" },
      { status: 400 },
    );
  }

  try {
    const wrapped = await getMonthlyWrappedData(authData.user.id, currentDate);
    return NextResponse.json(wrapped, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Failed to build monthly wrapped:", error);
    return NextResponse.json({ error: "Failed to load Bridge Wrapped" }, { status: 500 });
  }
}
