/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Calculates Paystack fees for NGN transactions.
 * Standard: 1.5% + ₦100 (₦100 waived for transactions < ₦2,500). Max cap: ₦2,000.
 */
function calculatePaystackFee(grossAmount: number): number {
  if (!grossAmount || grossAmount <= 0) return 0;

  const percentageFee = grossAmount * 0.015;
  const flatFee = grossAmount >= 2500 ? 100 : 0;
  const totalFee = percentageFee + flatFee;

  return Math.round(Math.min(totalFee, 2000));
}

export async function GET() {
  try {
    const supabase = createSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin configuration missing" },
        { status: 500 },
      );
    }

    // 1. Fetch automated Paystack gateway transactions
    const { data: transactions, error: txError } = await supabase
      .from("support_payment_transactions")
      .select(
        "id, user_id, user_email, plan_type, amount, status, paid_at, created_at, paystack_reference, paystack_channel",
      )
      .eq("status", "success");

    if (txError) {
      console.error("Error fetching transactions for finances:", txError);
    }

    // 2. Fetch subscriptions from user_subscriptions table
    const { data: subscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select(
        "id, user_id, user_email, plan_type, amount, status, created_at, updated_at, is_complimentary, paystack_reference",
      )
      .or("status.eq.active,status.eq.Active");

    if (subError) {
      console.error("Error fetching subscriptions for finances:", subError);
    }

    // 3. Fetch manual income & expense records from financial_ledgers
    const { data: ledgers, error: ledgerError } = await supabase
      .from("financial_ledgers")
      .select("id, title, amount, category, type, narration, date, created_at")
      .order("date", { ascending: false });

    if (ledgerError) {
      console.log("Financial ledgers table note:", ledgerError.message);
    }

    const processedReferences = new Set<string>();

    // A. Map Automated Gateway Transactions (ALWAYS deducts Paystack charges)
    const transactionIncomes = (transactions || []).map((tx) => {
      const grossAmount = Number(tx.amount) || 0;
      const paystackFee = calculatePaystackFee(grossAmount);
      const netAmount = Math.max(0, grossAmount - paystackFee);

      if (tx.paystack_reference) {
        processedReferences.add(tx.paystack_reference.trim());
      }

      return {
        id: `tx_${tx.id}`,
        title: `${(tx.plan_type || "Supporter").toUpperCase()} Payment (Net)`,
        amount: netAmount,
        grossAmount,
        paystackFee,
        category: "Subscription",
        type: "income" as const,
        narration: `Paystack Gateway | Gross: ₦${grossAmount.toLocaleString()} | Fee: -₦${paystackFee.toLocaleString()} | ${tx.user_email || "Supporter"}`,
        date: tx.paid_at || tx.created_at || new Date().toISOString(),
      };
    });

    const subscriptionIncomes = (subscriptions || [])
      .map((sub: any) => {
        const ref = sub.paystack_reference?.trim();

        // Avoid duplicate records already captured by Paystack.
        if (ref && processedReferences.has(ref)) {
          return null;
        }

        const grossAmount = Number(sub.amount) || 0;
        const paystackFee = 0;

        return {
          id: `sub_${sub.id}`,
          title: `${(sub.plan_type || "Subscription").toUpperCase()} (Manual Entry)`,
          amount: grossAmount,
          grossAmount,
          paystackFee,
          category: "Subscription",
          type: "income" as const,
          narration: sub.is_complimentary
            ? `Complimentary Tier (Manual) | ${sub.user_email || "Member"}`
            : `Manual Subscription Entry | Full: ₦${grossAmount.toLocaleString()} | ${sub.user_email || "Member"}`,
          date: sub.created_at || new Date().toISOString(),
        };
      })
      .filter((sub) => sub !== null);

    // C. Map manual ledger entries (Income & Expenses)
    const manualLedgerRecords = (ledgers || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      amount: Number(l.amount) || 0,
      grossAmount: Number(l.amount) || 0,
      paystackFee: 0,
      category: l.category || "General",
      type: l.type as "income" | "expense",
      narration: l.narration || "",
      date: l.date || l.created_at || new Date().toISOString(),
    }));

    // Combine and sort records by date descending
    const allRecords = [
      ...transactionIncomes,
      ...subscriptionIncomes,
      ...manualLedgerRecords,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      records: allRecords,
    });
  } catch (error: any) {
    console.error("Failed to load financial records:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
