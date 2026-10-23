import type { SupabaseClient } from "@supabase/supabase-js";

export type BillingCycleType = "monthly" | "yearly";

/** Adds whole calendar months (clamping 31st -> end of shorter months). */
export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInTarget = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInTarget));
  return d;
}

/**
 * Fields to write whenever a subscription is created or renewed. Renewing before the current
 * period ends extends from the old expiry so no paid time is lost. Reminder flags are reset.
 */
export async function buildPeriodFields(
  supabase: SupabaseClient,
  userId: string,
  options: { cycle: BillingCycleType; months?: number; reference?: string | null },
) {
  const now = new Date();
  let base = now;

  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("expires_at, status, paystack_reference, started_at, reminders_sent, grace_notified, expired_notified")
    .eq("user_id", userId)
    .maybeSingle();

  // The same Paystack payment is confirmed by both the verify call and the webhook: only the
  // first one may extend the plan, otherwise a single payment would buy two periods.
  if (
    options.reference &&
    existing?.status === "active" &&
    existing.expires_at &&
    existing.paystack_reference === options.reference
  ) {
    return {
      started_at: existing.started_at ?? now.toISOString(),
      expires_at: existing.expires_at,
      reminders_sent: existing.reminders_sent ?? [],
      grace_notified: existing.grace_notified ?? false,
      expired_notified: existing.expired_notified ?? false,
    };
  }

  if (existing?.status === "active" && existing.expires_at) {
    const current = new Date(existing.expires_at);
    if (current > now) base = current;
  }

  const months = options.months ?? (options.cycle === "yearly" ? 12 : 1);

  return {
    started_at: now.toISOString(),
    expires_at: addMonths(base, months).toISOString(),
    reminders_sent: [] as number[],
    grace_notified: false,
    expired_notified: false,
  };
}
