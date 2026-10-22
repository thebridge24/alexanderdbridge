import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const [{ data: subscriptions, error: subscriptionsError }, { data: transactions, error: transactionsError }] =
      await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("id, user_id, user_email, plan_type, billing_cycle, verification_tier, badge_color, amount, paystack_reference, paystack_channel, status, notes, created_at, updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("support_payment_transactions")
          .select("id, user_id, user_email, plan_type, billing_cycle, amount, paystack_reference, paystack_channel, status, paid_at, created_at, updated_at")
          .order("created_at", { ascending: false }),
      ]);

    if (subscriptionsError) throw subscriptionsError;
    if (transactionsError) throw transactionsError;

    const subscriptionRows = subscriptions || [];
    const transactionRows = transactions || [];
    const successfulTransactions = transactionRows.filter((row) => row.status === "success");

    return NextResponse.json({
      subscriptions: subscriptionRows,
      transactions: transactionRows,
      stats: {
        activeSubscribers: subscriptionRows.filter((row) => row.status === "active").length,
        pendingReviews: subscriptionRows.filter((row) => row.status === "pending_review").length,
        successfulPayments: successfulTransactions.length,
        cancelledPayments: transactionRows.filter((row) => row.status === "cancelled").length,
        failedPayments: transactionRows.filter((row) => row.status === "failed").length,
        totalRevenue: successfulTransactions.reduce((total, row) => total + (Number(row.amount) || 0), 0),
      },
    });
  } catch (error: any) {
    console.error("Failed to load admin subscriptions:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load subscriptions" },
      { status: 500 },
    );
  }
}
