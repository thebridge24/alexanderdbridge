import type { SupabaseClient } from "@supabase/supabase-js";
import { PLAN_CONFIGS, PlanType, BillingCycle } from "@/lib/payments/plans";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { buildPeriodFields } from "@/lib/subscriptions/period";
import { getSubscriptionEmail } from "@/lib/email/templates/subscription";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { sendNotification } from "@/lib/notifications/sender";

/**
 * Finds a user id by email across ALL pages. A plain `listUsers()` only returns the first 50
 * users, which is why payers beyond that were never matched to an account.
 */
export async function findUserIdByEmail(
  supabase: SupabaseClient,
  email: string | null | undefined,
): Promise<{ id: string; name: string | null } | null> {
  const target = (email || "").trim().toLowerCase();
  if (!target) return null;

  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) {
      return {
        id: match.id,
        name: match.user_metadata?.full_name || match.user_metadata?.name || null,
      };
    }
    if (data.users.length < perPage) return null;
  }
  return null;
}

export interface ActivateInput {
  reference: string;
  plan: PlanType;
  billingCycle: BillingCycle;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  amountPaid: number;
  /** Amount the checkout asked for. Underpaying activates nothing. */
  expectedAmount?: number | null;
  channel?: string | null;
  /** Use the payment date as the period start (backfilling an old payment). */
  paidAt?: string | null;
  skipEmail?: boolean;
}

export type ActivateResult =
  | { activated: true; userId: string; plan: PlanType; billingCycle: BillingCycle; tier: VerificationTier | null; alreadyProcessed: boolean; record: any }
  | { activated: false; reason: "no_account" | "amount_mismatch" | "expired" | "error"; message: string };

/**
 * Single place that turns a confirmed payment into an active subscription. It is idempotent per
 * Paystack reference, so the verify redirect and the webhook can both call it without giving
 * two billing periods or sending two emails.
 */
export async function activateSubscriptionFromPayment(
  supabase: SupabaseClient,
  input: ActivateInput,
): Promise<ActivateResult> {
  const plan = input.plan in PLAN_CONFIGS ? input.plan : "supporter";
  const cycle: BillingCycle = input.billingCycle === "yearly" ? "yearly" : "monthly";
  const planConfig = PLAN_CONFIGS[plan];

  const expected =
    input.expectedAmount ?? (cycle === "yearly" ? planConfig.yearlyAmount : planConfig.monthlyAmount);
  if (input.amountPaid + 0.5 < expected) {
    return {
      activated: false,
      reason: "amount_mismatch",
      message: `Paid ₦${input.amountPaid} but the ${plan} ${cycle} plan costs ₦${expected}.`,
    };
  }

  let userId = input.userId || null;
  let userName = input.name || null;
  const email = (input.email || "").trim().toLowerCase();

  if (!userId) {
    const found = await findUserIdByEmail(supabase, email);
    if (found) {
      userId = found.id;
      userName = userName || found.name;
    }
  }
  if (!userId) {
    return {
      activated: false,
      reason: "no_account",
      message: `No account found for ${email || "this payer"}. The payment is saved and will be linked when they sign in.`,
    };
  }

  const period = await buildPeriodFields(supabase, userId, { cycle, reference: input.reference });

  // Backfilling an old payment: the plan runs from the payment date, not from today
  if (input.paidAt) {
    const paid = new Date(input.paidAt);
    if (!Number.isNaN(paid.getTime())) {
      const months = cycle === "yearly" ? 12 : 1;
      const end = new Date(paid);
      end.setUTCMonth(end.getUTCMonth() + months);
      if (end.getTime() <= Date.now()) {
        return {
          activated: false,
          reason: "expired",
          message: `The ${cycle} plan paid on ${paid.toISOString().slice(0, 10)} has already run out.`,
        };
      }
      period.started_at = paid.toISOString();
      period.expires_at = end.toISOString();
    }
  }

  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("paystack_reference, status")
    .eq("user_id", userId)
    .maybeSingle();
  const alreadyProcessed =
    existing?.status === "active" && existing.paystack_reference === input.reference;

  const isVerifiedPlan = planConfig.showVerifiedIcon && plan !== "reader";
  const tier: VerificationTier | null = isVerifiedPlan ? (plan as VerificationTier) : null;
  const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;

  const { data: record, error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        ...period,
        user_id: userId,
        user_email: email || null,
        user_name: userName,
        plan_type: plan,
        billing_cycle: cycle,
        verification_tier: tier,
        badge_color: badgeColor,
        amount: Math.round(input.amountPaid),
        paystack_reference: input.reference,
        paystack_channel: input.channel || "card",
        payment_method: "Paystack",
        is_complimentary: false,
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("Could not save subscription after payment:", error.message);
    return { activated: false, reason: "error", message: error.message };
  }

  try {
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        is_verified: tier !== null,
        verification_tier: tier,
        badge_color: badgeColor,
        support_plan: plan,
        billing_cycle: cycle,
      },
    });
  } catch (metaErr) {
    console.error("Failed to mirror subscription to auth metadata:", metaErr);
  }

  if (!alreadyProcessed && !input.skipEmail) {
    const planTitle = plan.charAt(0).toUpperCase() + plan.slice(1);
    const expiresOn = new Date(record.expires_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    if (email.includes("@")) {
      const mail = getSubscriptionEmail("started", { name: userName || "Believer", planTitle, expiresOn });
      sendEmail({ from: getDefaultFromEmail(), to: email, subject: mail.subject, html: mail.html, text: mail.text }).catch(
        (e) => console.error("Subscription confirmation email failed:", e),
      );
    }
    sendNotification({
      userId,
      type: "admin",
      title: `You're now a ${planTitle} 🎉`,
      body: `Thank you! Your subscription is active until ${expiresOn}.`,
      link: "/devotional",
      dedupeKey: `sub-paid:${input.reference}`,
      push: true,
    }).catch((e) => console.error("Subscription notification failed:", e));
  }

  return { activated: true, userId, plan, billingCycle: cycle, tier, alreadyProcessed, record };
}
