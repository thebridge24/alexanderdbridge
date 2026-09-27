import { NextRequest, NextResponse } from "next/server";
import { sendNotification, sendTestPushToUser, sendTestPushToAll } from "@/lib/notifications/sender";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!userId) {
    return NextResponse.json(
      { error: " userId query param is required" },
      { status: 400 },
    );
  }

  const result = await sendNotification({
    userId,
    type: "reminder",
    title: "Test Notification",
    body: "Push notifications are working!",
    link: "/devotional",
    push: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    notificationId: result.notificationId,
    pushSent: result.pushSent,
  });
}

export async function POST(request: NextRequest) {
  let body: { userId?: string; all?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine - default to all.
  }

  if (body.all) {
    const sent = await sendTestPushToAll();
    return NextResponse.json({ ok: true, pushSent: sent, target: "all" });
  }

  const userId = body.userId?.trim();
  if (!userId) {
    return NextResponse.json(
      { error: " userId is required (or send { all: true })" },
      { status: 400 },
    );
  }

  const result = await sendNotification({
    userId,
    type: "reminder",
    title: "Test Notification",
    body: "Push notifications are working!",
    link: "/devotional",
    push: true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    notificationId: result.notificationId,
    pushSent: result.pushSent,
  });
}