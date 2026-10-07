import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendNotification, sendTestPushToAll } from "@/lib/notifications/sender";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: userData } = await supabase.auth.getUser(accessToken);
  if (!userData?.user) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  const userId = userData.user.id;

  const result = await sendNotification({
    userId,
    type: "reminder",
    title: "Test Notification 🔔",
    body: "Push notifications are working perfectly!",
    link: "/devotional",
    push: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.pushError) {
    return NextResponse.json(
      { error: `Push notification failed: ${result.pushError}`, notificationId: result.notificationId },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    notificationId: result.notificationId,
    pushSent: result.pushSent,
  });
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: userData } = await supabase.auth.getUser(accessToken);
  if (!userData?.user) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  let body: { userId?: string; all?: boolean } = {};
  try {
    body = await request.json();
  } catch {}

  const targetUserId = body.userId?.trim() || userData.user.id;

  if (body.all) {
    const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim());
    if (adminIds.length > 0 && !adminIds.includes(userData.user.id)) {
      return NextResponse.json({ error: "Admin authorization required for broadcasting" }, { status: 403 });
    }
    const broadcast = await sendTestPushToAll();
    if (!broadcast.ok) {
      return NextResponse.json(
        { error: broadcast.error || "Push broadcast failed", target: "all" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, publishId: broadcast.publishId, target: "all" });
  }

  const result = await sendNotification({
    userId: targetUserId,
    type: "reminder",
    title: "Test Notification 🔔",
    body: "Push notifications are working perfectly!",
    link: "/devotional",
    push: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  if (result.pushError) {
    return NextResponse.json(
      { error: `Push notification failed: ${result.pushError}`, notificationId: result.notificationId },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    notificationId: result.notificationId,
    pushSent: result.pushSent,
  });
}