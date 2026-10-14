import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ failed: [] });
    }

    const supabase = createSupabaseAdmin();
    const { data: logs, error } = await supabase
      .from("email_logs")
      .select("id, recipient, error_message, created_at")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Could not query failed email_logs:", error.message);
      return NextResponse.json({ failed: [] });
    }

    const failed = (logs || []).map((l) => ({
      id: l.id,
      email: l.recipient,
      errorReason: l.error_message || "Delivery failed",
      failedAt: l.created_at,
    }));

    return NextResponse.json({ failed });
  } catch (err: any) {
    console.error("Failed emails query exception:", err);
    return NextResponse.json({ failed: [] });
  }
}
