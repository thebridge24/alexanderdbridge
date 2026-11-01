import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

// How many people follow the signed-in user, and how many they follow
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
  const viewerId = authData.user.id;

  const [followers, following] = await Promise.all([
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", viewerId),
    supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", viewerId),
  ]);

  if (followers.error || following.error) {
    return NextResponse.json(
      { error: followers.error?.message || following.error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { followersCount: followers.count ?? 0, followingCount: following.count ?? 0 },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
