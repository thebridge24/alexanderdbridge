import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

type Tab = "followers" | "following";

/** 1234 -> "1.2k", 4900000 -> "4.9m", 13 -> "13" */
function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

// The signed-in user's followers or following list. Always scoped to the token's user.
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

  const tab: Tab = request.nextUrl.searchParams.get("tab") === "following" ? "following" : "followers";

  // Edges pointing at the tab's people: whoever follows me, or whoever I follow
  const { data: edges, error: edgeError } = await (tab === "followers"
    ? supabase.from("user_follows").select("follower_id").eq("following_id", viewerId)
    : supabase.from("user_follows").select("following_id").eq("follower_id", viewerId));
  if (edgeError) {
    return NextResponse.json({ error: edgeError.message }, { status: 500 });
  }

  const userIds = Array.from(
    new Set(
      (edges ?? []).map((row) =>
        tab === "followers" ? (row as { follower_id: string }).follower_id : (row as { following_id: string }).following_id,
      ),
    ),
  );
  if (userIds.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const [profilesRes, followerRowsRes, myFollowingRes, myFollowersRes, subsRes] = await Promise.all([
    supabase.from("user_profiles").select("user_id, display_name, full_name, avatar_url").in("user_id", userIds),
    supabase.from("user_follows").select("following_id").in("following_id", userIds),
    supabase.from("user_follows").select("following_id").eq("follower_id", viewerId).in("following_id", userIds),
    supabase.from("user_follows").select("follower_id").eq("following_id", viewerId).in("follower_id", userIds),
    supabase
      .from("user_subscriptions")
      .select("user_id, verification_tier")
      .in("user_id", userIds)
      .eq("status", "active"),
  ]);

  const profileMap = new Map<string, { name: string; avatarUrl: string }>();
  (profilesRes.data ?? []).forEach((p) => {
    profileMap.set(p.user_id, {
      name: p.full_name || p.display_name || "Believer",
      avatarUrl: p.avatar_url || "",
    });
  });

  const followerCounts = new Map<string, number>();
  (followerRowsRes.data ?? []).forEach((r) => {
    followerCounts.set(r.following_id, (followerCounts.get(r.following_id) ?? 0) + 1);
  });

  const iFollow = new Set((myFollowingRes.data ?? []).map((r) => r.following_id));
  const followsMe = new Set((myFollowersRes.data ?? []).map((r) => r.follower_id));

  const tierMap = new Map<string, string>();
  (subsRes.data ?? []).forEach((s) => {
    if (s.user_id && s.verification_tier) tierMap.set(s.user_id, s.verification_tier);
  });

  const users = userIds.map((id) => {
    const profile = profileMap.get(id);
    const name = profile?.name ?? "Believer";
    return {
      id,
      name,
      handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
      avatarUrl: profile?.avatarUrl ?? "",
      followersCount: `${formatCount(followerCounts.get(id) ?? 0)} followers`,
      isFollowing: iFollow.has(id),
      isFollower: followsMe.has(id),
      verificationTier: tierMap.get(id) ?? null,
    };
  });

  return NextResponse.json(
    { users },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
