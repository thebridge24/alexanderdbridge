export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { processSubscriptionLifecycle } from "@/lib/subscriptions/lifecycle";

/**
 * Daily subscription lifecycle: reminders at 7/5/3/2/1 days left, a 3-day grace period after
 * the plan ends, then back to the free level. Idempotent, so extra runs are harmless.
 */
async function handler(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processSubscriptionLifecycle(createSupabaseAdmin());
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("Subscription lifecycle cron failed:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
