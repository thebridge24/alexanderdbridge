/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    if (!supabase) {
      console.error("[API /admin/payments] Supabase admin client initialization failed.");
      return NextResponse.json(
        { error: "Supabase admin configuration missing" },
        { status: 500 }
      );
    }

    // Query 1: Payment Transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from("support_payment_transactions")
      .select("id, user_id, user_email, plan_type, billing_cycle, amount, paystack_reference, paystack_channel, status, paid_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error("[API /admin/payments] Error querying support_payment_transactions:", transactionsError);
    }

    // Query 2: User Subscriptions (Fallback to empty array if table error)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select("id, user_id, user_email, plan_type, billing_cycle, verification_tier, badge_color, amount, paystack_reference, paystack_channel, status, notes, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (subscriptionsError) {
      console.error("[API /admin/payments] Error querying user_subscriptions:", subscriptionsError);
    }

    const transactionRows = transactions || [];
    const subscriptionRows = subscriptions || [];
    const successfulTransactions = transactionRows.filter((row) => row.status === "success");

    return NextResponse.json({
      subscriptions: subscriptionRows,
      transactions: transactionRows,
      stats: {
        activeSubscribers: subscriptionRows.filter(
          (row) => row.status === "active" || row.status === "Active"
        ).length,
        pendingReviews: subscriptionRows.filter(
          (row) => row.status === "pending_review" || row.status === "Pending"
        ).length,
        successfulPayments: successfulTransactions.length,
        cancelledPayments: transactionRows.filter((row) => row.status === "cancelled").length,
        failedPayments: transactionRows.filter((row) => row.status === "failed").length,
        totalRevenue: successfulTransactions.reduce(
          (total, row) => total + (Number(row.amount) || 0),
          0
        ),
      },
    });
  } catch (error: any) {
    console.error("[API /admin/payments] Server-side catch error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}