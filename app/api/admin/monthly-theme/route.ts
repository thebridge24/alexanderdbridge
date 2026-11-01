import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Returns the signed-in user's id only if they are listed in ADMIN_USER_IDS. */
async function requireAdmin(request: NextRequest, supabase: ReturnType<typeof createSupabaseAdmin>) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data } = await supabase.auth.getUser(authorization.slice("Bearer ".length));
  const userId = data?.user?.id;
  if (!userId) return null;
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId) ? userId : null;
}

// Create or update the theme for one month. Only admins can write.
export async function PUT(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const supabase = createSupabaseAdmin();
  if (!(await requireAdmin(request, supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const monthKey = typeof body?.monthKey === "string" ? body.monthKey.trim() : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!MONTH_RE.test(monthKey)) {
    return NextResponse.json({ error: "monthKey must be YYYY-MM" }, { status: 400 });
  }
  if (!title || title.length > 120) {
    return NextResponse.json({ error: "Theme title is required (120 characters or fewer)" }, { status: 400 });
  }

  const { error } = await supabase.from("monthly_themes").upsert(
    {
      month_key: monthKey,
      title,
      scripture: typeof body?.scripture === "string" ? body.scripture.trim() || null : null,
      description: typeof body?.description === "string" ? body.description.trim() || null : null,
    },
    { onConflict: "month_key" },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
