import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 200;

// Records that this viewer saw these comments and replies. Each viewer counts once per item.
export async function POST(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim().slice(0, 100) : "";
  const items: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, MAX_ITEMS) : [];

  const supabase = createSupabaseAdmin();

  // Signed-in viewers count by account; everyone else by browser session
  let viewerKey = sessionId ? `session:${sessionId}` : "";
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authorization.slice("Bearer ".length));
    if (data?.user?.id) viewerKey = `user:${data.user.id}`;
  }
  if (!viewerKey) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const rows = items
    .filter(
      (i): i is { type: "comment" | "reply"; id: string } =>
        !!i &&
        typeof i === "object" &&
        ((i as any).type === "comment" || (i as any).type === "reply") &&
        typeof (i as any).id === "string" &&
        UUID_RE.test((i as any).id),
    )
    .map((i) => ({ target_type: i.type, target_id: i.id, viewer_key: viewerKey }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("devotional_comment_impressions")
      .upsert(rows, { onConflict: "target_type,target_id,viewer_key", ignoreDuplicates: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recorded: rows.length });
}
