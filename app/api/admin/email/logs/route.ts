import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database is not configured for email logs" },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'failed' | 'sent' | undefined
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const recipient = searchParams.get("recipient");

    const supabase = createSupabaseAdmin();
    let query = supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && (status === "failed" || status === "sent")) {
      query = query.eq("status", status);
    }

    if (recipient) {
      query = query.ilike("recipient", `%${recipient.trim()}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching email logs:", error);
      return NextResponse.json(
        { error: error.message || "Failed to retrieve email logs" },
        { status: 500 },
      );
    }

    const failedCount = logs ? logs.filter((l) => l.status === "failed").length : 0;
    const sentCount = logs ? logs.filter((l) => l.status === "sent").length : 0;

    return NextResponse.json({
      success: true,
      count: logs?.length || 0,
      sentCount,
      failedCount,
      logs: logs || [],
    });
  } catch (err: any) {
    console.error("Email logs route exception:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
