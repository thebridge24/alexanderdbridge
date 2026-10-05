import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching preferences:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // Default preferences if not yet created
      return NextResponse.json({
        preferences: {
          user_id: userData.user.id,
          reminder_enabled: true,
          reminder_time: "05:00:00",
          timezone: "UTC",
          likes_enabled: true,
          replies_enabled: true,
          streak_enabled: true,
        },
      });
    }

    return NextResponse.json({ preferences: data });
  } catch (err: any) {
    console.error("Failed to load preferences:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: {
    reminder_time?: string;
    timezone?: string;
    reminder_enabled?: boolean;
    likes_enabled?: boolean;
    replies_enabled?: boolean;
    streak_enabled?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const updates: Record<string, unknown> = {
      user_id: userData.user.id,
      updated_at: new Date().toISOString(),
    };

    if (typeof body.reminder_time === "string") {
      let timeStr = body.reminder_time.trim();
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        timeStr = `${timeStr.padStart(5, "0")}:00`;
      }
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        updates.reminder_time = timeStr;
      }
    }

    if (typeof body.timezone === "string" && body.timezone.trim()) {
      updates.timezone = body.timezone.trim();
    }

    if (typeof body.reminder_enabled === "boolean") {
      updates.reminder_enabled = body.reminder_enabled;
    }
    if (typeof body.likes_enabled === "boolean") {
      updates.likes_enabled = body.likes_enabled;
    }
    if (typeof body.replies_enabled === "boolean") {
      updates.replies_enabled = body.replies_enabled;
    }
    if (typeof body.streak_enabled === "boolean") {
      updates.streak_enabled = body.streak_enabled;
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(updates, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Error updating preferences:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data });
  } catch (err: any) {
    console.error("Failed to update preferences:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
