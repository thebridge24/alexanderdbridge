import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { syncPaidTransactions } from "@/lib/subscriptions/claim";

/** Admin "Sync payments": adds subscriptions for successful payments that were never linked. */
export async function POST() {
  try {
    const report = await syncPaidTransactions(createSupabaseAdmin());
    return NextResponse.json({ success: true, ...report });
  } catch (err: any) {
    console.error("Payment sync failed:", err);
    return NextResponse.json({ error: err?.message || "Sync failed" }, { status: 500 });
  }
}
