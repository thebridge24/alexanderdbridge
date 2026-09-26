import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    // Pull every authenticated user from auth.users (service_role bypasses RLS)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error listing auth users:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to load users" },
        { status: 500 },
      );
    }

    // Pull all user streak rows for metrics
    const { data: streakRows, error: streakError } = await supabase
      .from("user_streaks")
      .select(
        "user_id, current_streak, best_streak, last_visit_date, display_name, avatar_url, attendance_history, completed_devotionals",
      );

    if (streakError) {
      console.error("Error loading user streaks:", streakError);
    }

    const streakMap = new Map<string, any>();
    (streakRows || []).forEach((row) => {
      streakMap.set(row.user_id, row);
    });

    const users = (authUsers || []).map((u: any) => {
      const meta = u.user_metadata || {};
      const streak = streakMap.get(u.id);
      return {
        id: u.id,
        name:
          streak?.display_name ||
          meta?.full_name ||
          meta?.name ||
          u.email ||
          "Anonymous User",
        email: u.email || "",
        avatar_url:
          streak?.avatar_url ||
          meta?.avatar_url ||
          meta?.picture ||
          "",
        currentStreak: streak?.current_streak ?? 0,
        highestStreak: streak?.best_streak ?? 0,
        lastActiveDate: streak?.last_visit_date || "",
        createdAt: u.created_at,
        lastSignedIn: u.last_signed_in_at,
      };
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("Failed to load admin users:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}