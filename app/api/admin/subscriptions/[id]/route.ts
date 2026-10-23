import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

/** Removes a subscription and returns the user to the free level (badge off). */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createSupabaseAdmin();

    const { data: sub, error: findError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (findError) throw findError;
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("user_subscriptions").delete().eq("id", id);
    if (deleteError) throw deleteError;

    try {
      await supabase.auth.admin.updateUserById(sub.user_id, {
        user_metadata: { is_verified: false, verification_tier: null, badge_color: null, support_plan: null },
      });
    } catch (metaErr) {
      console.error("Failed to clear auth metadata after deleting subscription:", metaErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete subscription:", err);
    return NextResponse.json({ error: err?.message || "Failed to delete subscription" }, { status: 500 });
  }
}
