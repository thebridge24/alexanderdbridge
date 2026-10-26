import type { SupabaseClient } from "@supabase/supabase-js";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions/activate";
import type { BillingCycle, PlanType } from "@/lib/payments/plans";

export interface SyncReport {
  checked: number;
  activated: number;
  skipped: { reference: string; email: string | null; reason: string; message: string }[];
}

/**
 * Finds successful Paystack payments that never became a subscription (payer not matched to an
 * account at the time, webhook missed, etc.) and activates them. Payments whose plan period has
 * already run out are reported, not activated. Pass `email` to limit it to one person.
 */
export async function syncPaidTransactions(
  supabase: SupabaseClient,
  options: { email?: string | null } = {},
): Promise<SyncReport> {
  const report: SyncReport = { checked: 0, activated: 0, skipped: [] };

  let query = supabase
    .from("support_payment_transactions")
    .select("*")
    .eq("status", "success")
    .order("paid_at", { ascending: false, nullsFirst: false });
  if (options.email) query = query.eq("user_email", options.email.trim().toLowerCase());

  const { data: txns, error } = await query;
  if (error) {
    report.skipped.push({ reference: "-", email: options.email ?? null, reason: "error", message: error.message });
    return report;
  }

  // One subscription per user: only the newest payment per email/user is considered
  const seen = new Set<string>();
  for (const tx of txns ?? []) {
    const key = tx.user_id || tx.user_email || tx.paystack_reference;
    if (seen.has(key)) continue;
    seen.add(key);
    report.checked += 1;

    // Skip people who already have an active subscription tied to this payment
    if (tx.user_id) {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, paystack_reference")
        .eq("user_id", tx.user_id)
        .maybeSingle();
      if (sub?.status === "active") continue;
    }

    const outcome = await activateSubscriptionFromPayment(supabase, {
      reference: tx.paystack_reference,
      plan: tx.plan_type as PlanType,
      billingCycle: tx.billing_cycle as BillingCycle,
      userId: tx.user_id,
      email: tx.user_email,
      name: tx.metadata?.userName ?? null,
      amountPaid: tx.amount,
      expectedAmount: null,
      channel: tx.paystack_channel,
      paidAt: tx.paid_at || tx.created_at,
    });

    if (outcome.activated) {
      report.activated += 1;
      if (!tx.user_id) {
        await supabase
          .from("support_payment_transactions")
          .update({ user_id: outcome.userId })
          .eq("paystack_reference", tx.paystack_reference);
      }
    } else {
      report.skipped.push({
        reference: tx.paystack_reference,
        email: tx.user_email,
        reason: outcome.reason,
        message: outcome.message,
      });
    }
  }

  return report;
}
