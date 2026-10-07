import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/notifications/sender";

/** Broadcasts today's devotional push to every device subscribed through Pusher Beams. */
export async function POST() {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const result = await sendPushToAll(
      "Your daily devotional is ready",
      "Take a few minutes to read, reflect, and pray.",
      `/devotional/${date}`,
      "admin",
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Failed to trigger push notifications" },
        { status: 500 },
      );
    }

    // Beams fans out the broadcast itself and does not report a device count.
    return NextResponse.json({ success: true, publishId: result.publishId, sent: 1, removed: 0 });
  } catch (err: any) {
    console.error("Failed to trigger admin push:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
