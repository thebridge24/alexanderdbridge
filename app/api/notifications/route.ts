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
      .from("notification_events")
      .select("id, type, title, body, link, read, created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error loading notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (err: any) {
    console.error("Failed to load notifications:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { notificationId?: string; markAll?: boolean };
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

    if (body.markAll) {
      await supabase
        .from("notification_events")
        .update({ read: true })
        .eq("user_id", userData.user.id)
        .eq("read", false);
    } else if (body.notificationId) {
      await supabase
        .from("notification_events")
        .update({ read: true })
        .eq("id", body.notificationId)
        .eq("user_id", userData.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to update notifications:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}