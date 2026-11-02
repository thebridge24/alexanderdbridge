/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { computeStreaks } from "@/lib/utils/streak";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdmin();

    // 1. Get the currently logged-in user
    const authorization = request.headers.get("authorization");

    let viewerId: string | null = null;

    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice("Bearer ".length);

      const { data: authUser, error: authUserError } =
        await supabase.auth.getUser(token);

      if (!authUserError) {
        viewerId = authUser.user?.id ?? null;
      }
    }

    // 2. Fetch all user streaks
    const { data: streakRows, error: streakError } = await supabase
      .from("user_streaks")
      .select(
        "user_id, current_streak, best_streak, last_visit_date, display_name, avatar_url, attendance_history, completed_devotionals, created_at",
      );

    if (streakError) {
      console.error("Error loading user streaks:", streakError);

      return NextResponse.json(
        { error: streakError.message || "Failed to load streaks" },
        { status: 500 },
      );
    }

    // 3. Fetch auth users
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authError) {
      console.warn("Error listing auth users:", authError);
    }

    const authUsers = authData?.users || [];

    // 4. Map auth users by ID
    const authMap = new Map<string, any>();

    authUsers.forEach((u: any) => {
      authMap.set(u.id, u);
    });

    // 5. Map users who have streak records
    const streaksMapped = (streakRows || []).map((streak) => {
      const authUser = authMap.get(streak.user_id);
      const meta = authUser?.user_metadata || {};

      const computed = computeStreaks(
        streak.attendance_history,
        streak.completed_devotionals,
      );

      return {
        id: streak.user_id,
        name:
          streak.display_name ||
          meta.full_name ||
          meta.name ||
          authUser?.email ||
          "Anonymous User",
        email: authUser?.email || "",
        avatar_url:
          streak.avatar_url || meta.avatar_url || meta.picture || "",
        verification_tier: meta.verification_tier ?? null,
        currentStreak: computed.currentStreak,
        highestStreak: computed.bestStreak,
        lastActiveDate: streak.last_visit_date || "",
        createdAt: streak.created_at || authUser?.created_at,
        lastSignedIn: authUser?.last_sign_in_at,
      };
    });

    streaksMapped.sort(
      (a, b) =>
        b.currentStreak - a.currentStreak ||
        b.highestStreak - a.highestStreak,
    );

    // 6. Include auth users without streak records
    const streakUserIds = new Set(
      (streakRows || []).map((s) => s.user_id),
    );

    const uninitiatedAuthUsers = authUsers
      .filter((u) => !streakUserIds.has(u.id))
      .map((u) => {
        const meta = u.user_metadata || {};

        return {
          id: u.id,
          name:
            meta.full_name ||
            meta.name ||
            u.email ||
            "Anonymous User",
          email: u.email || "",
          avatar_url: meta.avatar_url || meta.picture || "",
          verification_tier: meta.verification_tier ?? null,
          currentStreak: 0,
          highestStreak: 0,
          lastActiveDate: "",
          createdAt: u.created_at,
          lastSignedIn: u.last_sign_in_at,
        };
      });

    const allUsers = [...streaksMapped, ...uninitiatedAuthUsers];

    // 7. Exclude the currently logged-in user
    const suggestedUsers = allUsers.filter(
      (user) => user.id !== viewerId,
    );

    // 8. Fetch follower relationships for all suggested users
    const userIds = suggestedUsers.map((user) => user.id);

    let followersCountMap = new Map<string, number>();
    let followingSet = new Set<string>();

    if (userIds.length > 0) {
      const [followersRes, followingRes] = await Promise.all([
        // Count how many people follow each suggested user
        supabase
          .from("user_follows")
          .select("following_id")
          .in("following_id", userIds),

        // Check which suggested users the current user follows
        viewerId
          ? supabase
              .from("user_follows")
              .select("following_id")
              .eq("follower_id", viewerId)
              .in("following_id", userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (followersRes.error) {
        throw followersRes.error;
      }

      if (followingRes.error) {
        throw followingRes.error;
      }

      // Build follower counts
      (followersRes.data ?? []).forEach((row) => {
        followersCountMap.set(
          row.following_id,
          (followersCountMap.get(row.following_id) ?? 0) + 1,
        );
      });

      // Build list of users the current user follows
      followingSet = new Set(
        (followingRes.data ?? []).map((row) => row.following_id),
      );
    }

    // 9. Attach follower count and follow status to each user
    const enrichedUsers = suggestedUsers.map((user) => ({
      ...user,
      followersCount: followersCountMap.get(user.id) ?? 0,
      isFollowing: followingSet.has(user.id),
    }));

    // 10. Return users
    return NextResponse.json(
      { users: enrichedUsers },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (err: any) {
    console.error("Failed to load admin users:", err);

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
