import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, createSupabaseAdmin } from "@/lib/supabase/server";
import { computeStreaks } from "@/lib/utils/streak";

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
    const todayParam = searchParams.get("today")?.trim();
    const today = todayParam && /^d{4}-d{2}-d{2}$/.test(todayParam) ? todayParam : undefined;

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

    // Streak numbers are always counted from the completed days, never read from stored columns
    const computed = computeStreaks(data.attendance_history, data.completed_devotionals, today);

    return NextResponse.json({
      found: true,
      streakData: {
        currentStreak: computed.currentStreak,
        bestStreak: computed.bestStreak,
        lastVisitDate: data.last_visit_date ?? "",
        unlockedMedalIds: Array.isArray(data.unlocked_medal_ids)
          ? data.unlocked_medal_ids
          : [],
        // Days only present in completed_devotionals are folded in so clients count the same days
        attendanceHistory: {
          ...Object.fromEntries(
            computed.completedDates.map((date) => [
              date,
              { date, completed: true, durationSeconds: 0 },
            ]),
          ),
          ...(data.attendance_history ?? {}),
        },
      },
      completedDevotionals: computed.completedDates,
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

    // Merge with what is already stored instead of overwriting it. A client that synced before
    // it finished loading (or from a fresh device) must never be able to wipe a saved streak.
    const { data: existing } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const incomingHistory: Record<string, any> =
      streakData.attendanceHistory && typeof streakData.attendanceHistory === "object"
        ? streakData.attendanceHistory
        : {};
    const storedHistory: Record<string, any> = existing?.attendance_history ?? {};
    const mergedHistory: Record<string, any> = { ...storedHistory, ...incomingHistory };
    for (const date of Object.keys(mergedHistory)) {
      // A day completed on either side stays completed
      if (storedHistory[date]?.completed || incomingHistory[date]?.completed) {
        mergedHistory[date] = { ...mergedHistory[date], completed: true };
      }
    }

    const completedFromHistory = Object.keys(mergedHistory).filter(
      (d) => mergedHistory[d]?.completed,
    );
    const mergedCompleted = Array.from(
      new Set<string>([
        ...(Array.isArray(existing?.completed_devotionals) ? existing.completed_devotionals : []),
        ...(Array.isArray(completedDevotionals) ? completedDevotionals : []),
        ...completedFromHistory,
      ]),
    ).sort();

    const mergedMedals = Array.from(
      new Set<string>([
        ...(Array.isArray(existing?.unlocked_medal_ids) ? existing.unlocked_medal_ids : []),
        ...(Array.isArray(streakData.unlockedMedalIds) ? streakData.unlockedMedalIds : []),
      ]),
    );

    const lastVisit = [existing?.last_visit_date, String(streakData.lastVisitDate || "")]
      .filter(Boolean)
      .sort()
      .pop();

    // Counted from the merged days; the incoming numbers are ignored
    const computed = computeStreaks(mergedHistory, mergedCompleted);

    const upsertPayload: Record<string, unknown> = {
      user_id: targetUserId,
      // Columns kept only as a cached copy for SQL/dashboards; readers compute from the days
      current_streak: computed.currentStreak,
      best_streak: Math.max(Number(existing?.best_streak) || 0, computed.bestStreak),
      last_visit_date: lastVisit ?? "",
      unlocked_medal_ids: mergedMedals,
      attendance_history: mergedHistory,
      completed_devotionals: mergedCompleted,
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
        currentStreak: computed.currentStreak,
        bestStreak: computed.bestStreak,
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
