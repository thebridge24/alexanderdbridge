import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolves the signed-in user from the Bearer token, or null. */
async function getViewerId(
  request: NextRequest,
  supabase: ReturnType<typeof createSupabaseAdmin>,
): Promise<string | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data } = await supabase.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  return data?.user?.id ?? null;
}

// Whether the signed-in viewer follows this user
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: targetId } = await context.params;
  if (!UUID_RE.test(targetId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const viewerId = await getViewerId(request, supabase);
  if (!viewerId) {
    return NextResponse.json({ isFollowing: false });
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ isFollowing: !!data });
}

// Follow or unfollow the target user, depending on the current state
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: targetId } = await context.params;
  if (!UUID_RE.test(targetId)) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const viewerId = await getViewerId(request, supabase);
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (viewerId === targetId) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", viewerId)
      .eq("following_id", targetId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ isFollowing: false });
  }

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: viewerId, following_id: targetId });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ isFollowing: true });
}
