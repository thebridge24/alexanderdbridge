import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendReminderNow } from "@/lib/subscriptions/lifecycle";

/** Admin "Send reminder" button: emails + notifies the subscriber right now. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const subscriptionId = body?.subscriptionId;
    if (!subscriptionId) {
      return NextResponse.json({ error: "subscriptionId is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: sub, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (error) throw error;
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    if (!sub.expires_at) {
      return NextResponse.json({ error: "This subscription has no end date to remind about." }, { status: 400 });
    }

    await sendReminderNow(sub);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to send subscription reminder:", err);
    return NextResponse.json({ error: err?.message || "Failed to send reminder" }, { status: 500 });
  }
}
