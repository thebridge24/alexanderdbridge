import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createSupabaseAdmin>;
type CommentTable = "devotional_comments" | "devotional_comment_replies";

/** The signed-in user's id, or null. */
async function getSignedInUserId(request: NextRequest, supabase: Supabase): Promise<string | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data } = await supabase.auth.getUser(authorization.slice("Bearer ".length));
  return data?.user?.id ?? null;
}

/** Only people with an active subscription may edit or delete their comments. */
async function hasActiveSubscription(supabase: Supabase, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** Checks sign-in, subscription and ownership. Returns an error response or null. */
async function checkOwner(
  request: NextRequest,
  supabase: Supabase,
  table: CommentTable,
  id: string,
): Promise<NextResponse | null> {
  const userId = await getSignedInUserId(request, supabase);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to change your comment" }, { status: 401 });
  }
  if (!(await hasActiveSubscription(supabase, userId))) {
    return NextResponse.json({ error: "Subscribe to edit or delete comments" }, { status: 403 });
  }

  const { data: row, error } = await supabase.from(table).select("author_user_id").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (row.author_user_id !== userId) {
    return NextResponse.json({ error: "You can only change your own comments" }, { status: 403 });
  }
  return null;
}

export async function editOwnedRow(request: NextRequest, table: CommentTable, id: string) {
  const supabase = createSupabaseAdmin();
  const denied = await checkOwner(request, supabase, table, id);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Comment must be 1 to 2000 characters" }, { status: 400 });
  }

  const { data, error } = await supabase.from(table).update({ body: text }).eq("id", id).select("id, body").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}

export async function deleteOwnedRow(request: NextRequest, table: CommentTable, id: string) {
  const supabase = createSupabaseAdmin();
  const denied = await checkOwner(request, supabase, table, id);
  if (denied) return denied;

  // A comment's replies go with it
  if (table === "devotional_comments") {
    await supabase.from("devotional_comment_replies").delete().eq("comment_id", id);
  }
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
