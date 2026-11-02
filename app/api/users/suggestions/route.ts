
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

export async function GET(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  try {
    const supabase = createSupabaseAdmin();

    const authorization = request.headers.get("authorization");

    let viewerId: string | null = null;

    if (authorization?.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser(
        authorization.slice("Bearer ".length),
      );
      viewerId = data?.user?.id ?? null;
    }

    // 1. Fetch all user profiles
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, full_name, avatar_url");

    if (profileError) throw profileError;

    const users = profiles ?? [];

    if (users.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const userIds = users.map((u) => u.user_id);

    // 2. Fetch follower relationships and my following list
    const [followsRes, followingRes, subsRes] = await Promise.all([
      supabase
        .from("user_follows")
        .select("following_id")
        .in("following_id", userIds),

      viewerId
        ? supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", viewerId)
            .in("following_id", userIds)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("user_subscriptions")
        .select("user_id, verification_tier")
        .in("user_id", userIds)
        .eq("status", "active"),
    ]);

    if (followsRes.error) throw followsRes.error;
    if (followingRes.error) throw followingRes.error;
    if (subsRes.error) throw subsRes.error;

    // 3. Calculate follower counts
    const followerCounts = new Map<string, number>();

    (followsRes.data ?? []).forEach((row) => {
      followerCounts.set(
        row.following_id,
        (followerCounts.get(row.following_id) ?? 0) + 1,
      );
    });

    // 4. Identify users I already follow
    const followingSet = new Set(
      (followingRes.data ?? []).map((row) => row.following_id),
    );

    // 5. Verification tiers
    const tierMap = new Map<string, string>();

    (subsRes.data ?? []).forEach((sub) => {
      if (sub.user_id && sub.verification_tier) {
        tierMap.set(sub.user_id, sub.verification_tier);
      }
    });

    // 6. Return formatted users
    const formattedUsers = users
      .filter((user) => user.user_id !== viewerId)
      .map((user) => {
        const name =
          user.full_name || user.display_name || "Bridge Believer";

        return {
          id: user.user_id,
          name,
          handle: `@${name.toLowerCase().replace(/\s+/g, "")}`,
          avatarUrl: user.avatar_url || "",
          followersCount: followerCounts.get(user.user_id) ?? 0,
          isFollowing: followingSet.has(user.user_id),
          verificationTier: tierMap.get(user.user_id) ?? null,
        };
      });

    return NextResponse.json(
      { users: formattedUsers },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (err: any) {
    console.error("Failed to fetch suggested users:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
