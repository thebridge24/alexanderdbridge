import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { PLAN_CONFIGS, PlanType, BillingCycle } from "@/lib/payments/plans";
import { recordPaymentTransaction } from "@/lib/payments/transactions";
import { buildPeriodFields } from "@/lib/subscriptions/period";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const {
      email,
      fullName,
      plan = "supporter",
      billingCycle = "monthly",
      reference,
      notes,
    } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required to process verification." },
        { status: 400 },
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (fullName || "").trim() || "Believer";
    const selectedPlan = (plan as PlanType) in PLAN_CONFIGS ? (plan as PlanType) : "supporter";
    const selectedCycle = (billingCycle as BillingCycle) === "yearly" ? "yearly" : "monthly";

    const planConfig = PLAN_CONFIGS[selectedPlan];
    const isVerifiedPlan = planConfig.showVerifiedIcon && selectedPlan !== "reader";
    const tier: VerificationTier | null = isVerifiedPlan ? (selectedPlan as VerificationTier) : null;
    const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;
    const expectedAmount = selectedCycle === "yearly" ? planConfig.yearlyAmount : planConfig.monthlyAmount;

    const supabase = createSupabaseAdmin();

    // 1. Identify User ID from token if present or from list of users by email
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    let userId: string | null = null;

    if (accessToken) {
      const { data: authData } = await supabase.auth.getUser(accessToken);
      if (authData?.user) {
        userId = authData.user.id;
      }
    }

    if (!userId) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existingUser = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail,
      );
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    // 2. Check if reference is immediately verified by Paystack
    let subscriptionStatus: "active" | "pending_review" = "pending_review";
    let channel = "bank_transfer";
    let verifiedAmount = expectedAmount;

    if (reference && typeof reference === "string" && reference.trim().length > 0) {
      try {
        const paystackResult = await verifyPaystackTransaction(reference.trim());
        if (paystackResult.status) {
          await recordPaymentTransaction({
            reference: reference.trim(),
            userId,
            email: paystackResult.customerEmail || cleanEmail,
            plan: (paystackResult.metadata?.plan as PlanType) || selectedPlan,
            billingCycle: (paystackResult.metadata?.billingCycle as BillingCycle) || selectedCycle,
            amount: paystackResult.amountInNgn || expectedAmount,
            channel: paystackResult.channel,
            status:
              paystackResult.status === "success"
                ? "success"
                : paystackResult.status === "abandoned"
                  ? "cancelled"
                  : paystackResult.status === "failed"
                    ? "failed"
                    : "pending",
            paidAt: paystackResult.paidAt,
            metadata: paystackResult.metadata,
          });
        }
        if (paystackResult.success && paystackResult.status === "success") {
          subscriptionStatus = "active";
          channel = paystackResult.channel || "paystack";
          if (paystackResult.amountInNgn) {
            verifiedAmount = paystackResult.amountInNgn;
          }
        } else if (["failed", "abandoned"].includes(paystackResult.status || "")) {
          return NextResponse.json(
            { error: `This Paystack payment is ${paystackResult.status}. No subscription was created.` },
            { status: 400 },
          );
        }
      } catch (err) {
        console.warn("Could not auto-verify Paystack reference:", err);
      }
    }

    // 3. Persist in database
    const nowIso = new Date().toISOString();
    if (userId) {
      // Only an active (paid/verified) subscription starts a billing period
      const period =
        subscriptionStatus === "active"
          ? await buildPeriodFields(supabase, userId, { cycle: selectedCycle, reference: reference ? String(reference).trim() : null })
          : {};
      await supabase.from("user_subscriptions").upsert(
        {
          ...period,
          user_name: cleanName,
          is_complimentary: false,
          payment_method: reference ? "Paystack" : "Bank Transfer",
          user_id: userId,
          user_email: cleanEmail,
          plan_type: selectedPlan,
          billing_cycle: selectedCycle,
          verification_tier: tier,
          badge_color: badgeColor,
          amount: verifiedAmount,
          paystack_reference: reference ? reference.trim() : null,
          paystack_channel: channel,
          notes: notes ? notes.trim() : null,
          status: subscriptionStatus,
          updated_at: nowIso,
        },
        { onConflict: "user_id" },
      );

      // If already active via Paystack, mirror directly to user metadata
      if (subscriptionStatus === "active") {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: {
            is_verified: tier !== null,
            verification_tier: tier,
            badge_color: badgeColor,
            support_plan: selectedPlan,
            billing_cycle: selectedCycle,
          },
        });
      }
    }

    // 4. Send Confirmation / "Review in Progress" Email via SendByte
    const planTitle = selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1);
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; padding: 32px; border: 1px solid #262626;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background: rgba(59,130,246,0.15); color: #3b82f6; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
            Verification Request Received
          </span>
          <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #fff;">
            Your Verified Badge is on the Way! 🎉
          </h1>
          <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
            Hi ${cleanName}, thank you for your support as a <strong>${planTitle}</strong>!
          </p>
        </div>

        <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #888; padding: 8px 0;">Plan Tier</td>
              <td style="color: #fff; text-align: right; font-weight: bold; text-transform: capitalize;">${selectedPlan}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 8px 0;">Billing Cycle</td>
              <td style="color: #fff; text-align: right; font-weight: bold; text-transform: capitalize;">${selectedCycle}</td>
            </tr>
            ${
              reference
                ? `<tr>
                    <td style="color: #888; padding: 8px 0;">Payment Reference</td>
                    <td style="color: #fff; text-align: right; font-family: monospace; font-size: 12px;">${reference}</td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="color: #888; padding: 8px 0;">Review Status</td>
              <td style="color: ${subscriptionStatus === "active" ? "#10b981" : "#eab308"}; text-align: right; font-weight: bold;">
                ${subscriptionStatus === "active" ? "Verified & Active" : "Review in Progress"}
              </td>
            </tr>
          </table>
        </div>

        <p style="color: #999; font-size: 13px; line-height: 1.6;">
          Our review team is currently verifying your payment details. Once verified, your custom <strong>${tier ? VERIFICATION_TIERS[tier].label : "Community"}</strong> badge will appear automatically across your profile, daily devotional comments, and streak records.
        </p>

        <div style="text-align: center; margin-top: 32px;">
          <a href="https://alexanderdbridge.com/devotional" style="display: inline-block; padding: 12px 28px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 13px;">
            Return to Daily Devotional
          </a>
        </div>
      </div>
    `;

    sendEmail({
      from: getDefaultFromEmail(),
      to: cleanEmail,
      subject: `Your Bridge Daily ${planTitle} Verified Badge is on the way! 🎉`,
      html: emailHtml,
      text: `Hi ${cleanName}, we received your verification submission for the ${planTitle} plan. Our review team is on it!`,
    }).catch((e) => console.error("Error sending verification request email:", e));

    return NextResponse.json({
      success: true,
      status: subscriptionStatus,
      isAutoVerified: subscriptionStatus === "active",
      message:
        subscriptionStatus === "active"
          ? "Payment confirmed! Your verified badge is now active."
          : "Your verified badge is on the way! Our review team is on it.",
      subscription: {
        userId,
        plan: selectedPlan,
        billingCycle: selectedCycle,
        tier,
        badgeColor,
        reference,
        status: subscriptionStatus,
      },
    });
  } catch (error: any) {
    console.error("Verification request submission error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process verification request" },
      { status: 500 },
    );
  }
}
