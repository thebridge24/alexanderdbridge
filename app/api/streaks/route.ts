import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId")?.trim();

    // Check optional bearer token
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    const supabase = createSupabaseAdmin();
    let targetUserId = userIdParam;

    if (accessToken) {
      const { data: userData } = await supabase.auth.getUser(accessToken);
      if (userData?.user?.id) {
        targetUserId = userData.user.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user streak:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        found: false,
        streakData: null,
        completedDevotionals: [],
      });
    }

    return NextResponse.json({
      found: true,
      streakData: {
        currentStreak: data.current_streak ?? 0,
        bestStreak: data.best_streak ?? 0,
        lastVisitDate: data.last_visit_date ?? "",
        unlockedMedalIds: Array.isArray(data.unlocked_medal_ids)
          ? data.unlocked_medal_ids
          : [],
        attendanceHistory: data.attendance_history ?? {},
      },
      completedDevotionals: Array.isArray(data.completed_devotionals)
        ? data.completed_devotionals
        : [],
    });
  } catch (error) {
    console.error("Failed to load streak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      userId: bodyUserId,
      streakData,
      completedDevotionals,
      displayName,
      avatarUrl,
    } = body;

    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    const supabase = createSupabaseAdmin();
    let targetUserId = bodyUserId;

    if (accessToken) {
      const { data: userData } = await supabase.auth.getUser(accessToken);
      if (userData?.user?.id) {
        targetUserId = userData.user.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!streakData) {
      return NextResponse.json(
        { error: "Streak data is required" },
        { status: 400 }
      );
    }

    const upsertPayload: Record<string, unknown> = {
      user_id: targetUserId,
      current_streak: Number(streakData.currentStreak) || 0,
      best_streak: Number(streakData.bestStreak) || 0,
      last_visit_date: String(streakData.lastVisitDate || ""),
      unlocked_medal_ids: Array.isArray(streakData.unlockedMedalIds)
        ? streakData.unlockedMedalIds
        : [],
      attendance_history: streakData.attendanceHistory || {},
      completed_devotionals: Array.isArray(completedDevotionals)
        ? completedDevotionals
        : [],
      updated_at: new Date().toISOString(),
    };

    if (displayName) upsertPayload.display_name = displayName;
    if (avatarUrl) upsertPayload.avatar_url = avatarUrl;

    const { data, error } = await supabase
      .from("user_streaks")
      .upsert(upsertPayload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Error saving user streak:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      streakData: {
        currentStreak: data.current_streak,
        bestStreak: data.best_streak,
        lastVisitDate: data.last_visit_date,
        unlockedMedalIds: data.unlocked_medal_ids,
        attendanceHistory: data.attendance_history,
      },
      completedDevotionals: data.completed_devotionals,
    });
  } catch (error) {
    console.error("Failed to sync streak:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
