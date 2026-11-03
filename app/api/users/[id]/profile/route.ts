import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public profile details shown in other people's popups. Deliberately no email.
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data } = await supabase.auth.admin.getUserById(id);
  const meta = data?.user?.user_metadata ?? {};

  return NextResponse.json(
    { bannerUrl: typeof meta.banner_url === "string" ? meta.banner_url : null },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
