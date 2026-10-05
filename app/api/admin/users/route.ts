import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    // 1. Fetch all user streaks from the database
    const { data: streakRows, error: streakError } = await supabase
      .from("user_streaks")
      .select(
        "user_id, current_streak, best_streak, last_visit_date, display_name, avatar_url, attendance_history, completed_devotionals, created_at"
      )
      .order("current_streak", { ascending: false });

    if (streakError) {
      console.error("Error loading user streaks:", streakError);
      return NextResponse.json(
        { error: streakError.message || "Failed to load streaks" },
        { status: 500 }
      );
    }

    // 2. Fetch auth users (handling pagination up to 1000 users)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      console.warn("Error listing auth users:", authError);
    }

    // Safely extract users array from auth response
    const authUsers = authData?.users || [];

    // Map auth users by ID for quick lookup
    const authMap = new Map<string, any>();
    authUsers.forEach((u: any) => authMap.set(u.id, u));

    // Map streak rows to output format
    const streaksMapped = (streakRows || []).map((streak) => {
      const authUser = authMap.get(streak.user_id);
      const meta = authUser?.user_metadata || {};

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
          streak.avatar_url ||
          meta.avatar_url ||
          meta.picture ||
          "",
        currentStreak: streak.current_streak ?? 0,
        highestStreak: streak.best_streak ?? 0,
        lastActiveDate: streak.last_visit_date || "",
        createdAt: streak.created_at || authUser?.created_at,
        lastSignedIn: authUser?.last_sign_in_at,
      };
    });

    // Option: Include any auth users who don't have a user_streaks row yet
    const streakUserIds = new Set((streakRows || []).map((s) => s.user_id));
    const uninitiatedAuthUsers = authUsers
      .filter((u) => !streakUserIds.has(u.id))
      .map((u) => {
        const meta = u.user_metadata || {};
        return {
          id: u.id,
          name: meta.full_name || meta.name || u.email || "Anonymous User",
          email: u.email || "",
          avatar_url: meta.avatar_url || meta.picture || "",
          currentStreak: 0,
          highestStreak: 0,
          lastActiveDate: "",
          createdAt: u.created_at,
          lastSignedIn: u.last_sign_in_at,
        };
      });

    const allUsers = [...streaksMapped, ...uninitiatedAuthUsers];

    return NextResponse.json({ users: allUsers });
  } catch (err: any) {
    console.error("Failed to load admin users:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
