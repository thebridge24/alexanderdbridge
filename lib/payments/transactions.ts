import { createSupabaseAdmin } from "@/lib/supabase/server";
import { BillingCycle, PlanType } from "@/lib/payments/plans";

export type PaymentTransactionStatus = "pending" | "success" | "cancelled" | "failed";

interface RecordPaymentTransactionInput {
  reference: string;
  userId?: string | null;
  email?: string | null;
  plan?: PlanType | string | null;
  billingCycle?: BillingCycle | string | null;
  amount?: number | null;
  channel?: string | null;
  status: PaymentTransactionStatus;
  paidAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

const validPlans = new Set<PlanType>(["reader", "supporter", "sponsor", "patron"]);

export async function recordPaymentTransaction(input: RecordPaymentTransactionInput) {
  const reference = input.reference.trim();
  if (!reference) return;

  const plan = validPlans.has(input.plan as PlanType) ? (input.plan as PlanType) : "supporter";
  const billingCycle = input.billingCycle === "yearly" ? "yearly" : "monthly";
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("support_payment_transactions").upsert(
    {
      paystack_reference: reference,
      user_id: input.userId || null,
      user_email: input.email?.trim().toLowerCase() || null,
      plan_type: plan,
      billing_cycle: billingCycle,
      amount: Math.max(0, Math.round(Number(input.amount) || 0)),
      paystack_channel: input.channel || null,
      status: input.status,
      paid_at: input.paidAt || null,
      metadata: input.metadata || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paystack_reference" },
  );

  if (error) {
    // Payment processing must not fail solely because the optional audit ledger
    // is unavailable during a migration/deployment window.
    console.error("Could not record support payment transaction:", error.message);
  }
}
