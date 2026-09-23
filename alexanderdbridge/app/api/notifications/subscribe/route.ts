import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!accessToken) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token || token.length > 4096) {
      return NextResponse.json({ error: "A valid notification token is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const { error } = await supabase.from("push_notification_tokens").upsert(
      {
        user_id: userData.user.id,
        token,
        platform: "web",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" },
    );

    if (error) {
      console.error("Error storing push token:", error);
      return NextResponse.json({ error: "Could not enable notifications" }, { status: 500 });
    }

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("Notification subscription failed:", error);
    return NextResponse.json({ error: "Could not enable notifications" }, { status: 500 });
  }
}
