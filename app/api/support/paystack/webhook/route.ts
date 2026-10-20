import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { PlanType, BillingCycle, PLAN_CONFIGS } from "@/lib/payments/plans";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      console.warn("Paystack webhook received with invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { event, data } = payload || {};

    if (event === "charge.success" && data?.status === "success") {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const plan = (metadata.plan as PlanType) || "supporter";
      const billingCycle = (metadata.billingCycle as BillingCycle) || "monthly";
      let userId = metadata.userId as string | null;
      const userEmail = (data.customer?.email || metadata.userEmail || "").trim().toLowerCase();
      const userName = metadata.userName || "Believer";
      const amountInNgn = (data.amount || 0) / 100;

      const supabase = createSupabaseAdmin();

      if (!userId && userEmail) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const existing = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === userEmail.toLowerCase(),
        );
        if (existing) {
          userId = existing.id;
        }
      }

      const planConfig = PLAN_CONFIGS[plan];
      const isVerifiedPlan = planConfig?.showVerifiedIcon && plan !== "reader";
      const tier: VerificationTier | null = isVerifiedPlan ? (plan as VerificationTier) : null;
      const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;

      if (userId) {
        const nowIso = new Date().toISOString();
        await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            user_email: userEmail,
            plan_type: plan,
            billing_cycle: billingCycle,
            verification_tier: tier,
            badge_color: badgeColor,
            amount: amountInNgn,
            paystack_reference: reference,
            paystack_channel: data.channel || "card",
            status: "active",
            updated_at: nowIso,
          },
          { onConflict: "user_id" },
        );

        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            is_verified: tier !== null,
            verification_tier: tier,
            badge_color: badgeColor,
            support_plan: plan,
            billing_cycle: billingCycle,
          },
        });
      }

      // Send SendByte notification email
      if (userEmail && userEmail.includes("@")) {
        const planTitle = plan.charAt(0).toUpperCase() + plan.slice(1);
        sendEmail({
          from: getDefaultFromEmail(),
          to: userEmail,
          subject: `Your Bridge Daily ${planTitle} Membership is Confirmed! ❤️`,
          text: `Hi ${userName}, your payment of ₦${amountInNgn.toLocaleString()} on Paystack was successful. Thank you! Reference: ${reference}`,
        }).catch((e) => console.error("Webhook email error:", e));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: error?.message || "Webhook error" }, { status: 500 });
  }
}
