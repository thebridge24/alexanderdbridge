import { NextResponse } from "next/server";
import { sendDevotionalReminder } from "@/lib/notifications/devotional-reminders";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (
    !secret ||
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await sendDevotionalReminder("afternoon");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Afternoon devotional reminder failed:", error);

    return NextResponse.json(
      { error: "Failed to send afternoon reminder" },
      { status: 500 },
    );
  }
}