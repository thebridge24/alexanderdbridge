import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_CONFIGS, PlanType } from "@/lib/payments/plans";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = ["active", "expired", "canceled", "paused", "pending_review"];

/** Edit a subscription's details from the admin dashboard. */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data: sub, error: findError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (findError) throw findError;
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.userName === "string") updates.user_name = body.userName.trim() || null;
    if (typeof body.email === "string") {
      const email = body.email.trim().toLowerCase();
      if (email && !email.includes("@")) {
        return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
      }
      updates.user_email = email || null;
    }
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
    if (typeof body.paymentMethod === "string") updates.payment_method = body.paymentMethod.trim() || null;
    if (typeof body.paystackRef === "string") updates.paystack_reference = body.paystackRef.trim() || null;
    if (typeof body.isComplimentary === "boolean") updates.is_complimentary = body.isComplimentary;

    if (body.billingCycle !== undefined) {
      if (!["monthly", "yearly"].includes(body.billingCycle)) {
        return NextResponse.json({ error: "Billing cycle must be monthly or yearly" }, { status: 400 });
      }
      updates.billing_cycle = body.billingCycle;
    }
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
      }
      updates.amount = Math.round(amount);
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (body.plan !== undefined) {
      const plan = String(body.plan).toLowerCase();
      if (!(plan in PLAN_CONFIGS)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      updates.plan_type = plan;
    }
    if (body.startDate !== undefined && body.startDate !== "") {
      const d = new Date(body.startDate);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
      updates.started_at = d.toISOString();
    }
    if (body.expiryDate !== undefined && body.expiryDate !== "") {
      const d = new Date(body.expiryDate);
      if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "Invalid expiry date" }, { status: 400 });
      updates.expires_at = d.toISOString();
      // A new end date restarts the reminder and grace cycle
      if (d.toISOString() !== sub.expires_at) {
        updates.reminders_sent = [];
        updates.grace_notified = false;
        updates.expired_notified = false;
      }
    }

    // Keep the badge in step with the plan and status
    const finalPlan = (updates.plan_type as PlanType) ?? (sub.plan_type as PlanType);
    const finalStatus = (updates.status as string) ?? sub.status;
    const planConfig = PLAN_CONFIGS[finalPlan];
    const tier: VerificationTier | null =
      finalStatus === "active" && planConfig?.showVerifiedIcon && finalPlan !== "reader"
        ? (finalPlan as VerificationTier)
        : null;
    updates.verification_tier = tier;
    updates.badge_color = tier ? VERIFICATION_TIERS[tier].hexColor : null;

    // Reactivating with a past end date would be removed again straight away
    if (finalStatus === "active" && sub.status !== "active" && body.expiryDate === undefined) {
      const expires = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
      if (expires < Date.now()) {
        return NextResponse.json(
          { error: "Set a new expiry date when reactivating a subscription." },
          { status: 400 },
        );
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_subscriptions")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (updateError) throw updateError;

    try {
      await supabase.auth.admin.updateUserById(sub.user_id, {
        user_metadata: {
          is_verified: tier !== null,
          verification_tier: tier,
          badge_color: tier ? VERIFICATION_TIERS[tier].hexColor : null,
          support_plan: finalStatus === "active" ? finalPlan : null,
          billing_cycle: updated.billing_cycle,
        },
      });
    } catch (metaErr) {
      console.error("Failed to sync auth metadata after editing subscription:", metaErr);
    }

    return NextResponse.json({ success: true, subscription: updated });
  } catch (err: any) {
    console.error("Failed to update subscription:", err);
    return NextResponse.json({ error: err?.message || "Failed to update subscription" }, { status: 500 });
  }
}

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
