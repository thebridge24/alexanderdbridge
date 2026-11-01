import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { currentMonthKey, getMonthlyTheme } from "@/lib/themes/monthlyTheme";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Public: the theme of a month (defaults to the current month)
export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("month")?.trim();
  if (requested && !MONTH_RE.test(requested)) {
    return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });
  }

  const supabase = isSupabaseConfigured() ? createSupabaseAdmin() : null;
  const theme = await getMonthlyTheme(supabase, requested || currentMonthKey());
  return NextResponse.json(theme, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
