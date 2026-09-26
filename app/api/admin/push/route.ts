import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createSupabaseAdmin();

    // Resolve the Supabase project URL + service role key to invoke the edge function.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase is not configured" },
        { status: 503 },
      );
    }

    // Count how many tokens are registered so the admin gets useful feedback.
    const { count, error: countError } = await supabase
      .from("push_notification_tokens")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting push tokens:", countError);
    }

    // Invoke the scheduled daily-push edge function directly.
    const functionUrl = `${supabaseUrl}/functions/v1/send-daily-devotional`;
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.error || "Failed to trigger push notifications",
          registeredTokens: count ?? 0,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sent: result.sent ?? 0,
      removed: result.removed ?? 0,
      registeredTokens: count ?? 0,
    });
  } catch (err: any) {
    console.error("Failed to trigger admin push:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}