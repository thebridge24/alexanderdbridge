import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { PlanType, BillingCycle, PLAN_CONFIGS } from "@/app/components/support/SupportPlanCard";

async function processPaymentActivation(reference: string) {
  const result = await verifyPaystackTransaction(reference);

  if (!result.success || result.status !== "success") {
    return {
      success: false,
      error: result.error || `Payment status is ${result.status || "unsuccessful"}`,
    };
  }

  const metadata = result.metadata || {};
  const plan = (metadata.plan as PlanType) || "supporter";
  const billingCycle = (metadata.billingCycle as BillingCycle) || "monthly";
  let userId = metadata.userId as string | null;
  const userEmail = (result.customerEmail || metadata.userEmail || "").trim().toLowerCase();
  const userName = metadata.userName || "Believer";

  const supabase = createSupabaseAdmin();

  // If userId not present in metadata, look up by email
  if (!userId && userEmail) {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existing = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === userEmail.toLowerCase(),
    );
    if (existing) {
      userId = existing.id;
    }
  }

  // Determine tier & badge attributes
  const planConfig = PLAN_CONFIGS[plan];
  const isVerifiedPlan = planConfig?.showVerifiedIcon && plan !== "reader";
  const tier: VerificationTier | null = isVerifiedPlan ? (plan as VerificationTier) : null;
  const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;
  const amountInNgn = result.amountInNgn || planConfig?.monthlyAmount || 0;

  // 1. Upsert into database
  let subscriptionRecord = null;
  if (userId) {
    const nowIso = new Date().toISOString();
    const { data: subData, error: subError } = await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          user_email: userEmail,
          plan_type: plan,
          billing_cycle: billingCycle,
          verification_tier: tier,
          badge_color: badgeColor,
          amount: amountInNgn,
          paystack_reference: reference,
          paystack_channel: result.channel || "card",
          status: "active",
          updated_at: nowIso,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (subError) {
      console.warn("Could not upsert user_subscriptions row:", subError.message);
    } else {
      subscriptionRecord = subData;
    }

    // 2. Mirror into auth user_metadata
    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          is_verified: tier !== null,
          verification_tier: tier,
          badge_color: badgeColor,
          support_plan: plan,
          billing_cycle: billingCycle,
        },
      });
    } catch (metaErr) {
      console.error("Failed to update auth metadata:", metaErr);
    }
  }

  // 3. Send SendByte Confirmation Email
  if (userEmail && userEmail.includes("@")) {
    const planTitle = plan.charAt(0).toUpperCase() + plan.slice(1);
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; padding: 32px; border: 1px solid #262626;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
            Payment Verified • Paystack
          </span>
          <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #fff;">
            Thank You for Supporting Bridge Daily ❤️
          </h1>
          <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
            Hi ${userName}, your payment of ₦${amountInNgn.toLocaleString()} has been received and verified.
          </p>
        </div>

        <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #888; padding: 8px 0;">Plan</td>
              <td style="color: #fff; text-align: right; font-weight: bold; text-transform: capitalize;">${plan}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 8px 0;">Billing Cycle</td>
              <td style="color: #fff; text-align: right; font-weight: bold; text-transform: capitalize;">${billingCycle}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 8px 0;">Amount Paid</td>
              <td style="color: #fff; text-align: right; font-weight: bold;">₦${amountInNgn.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #888; padding: 8px 0;">Payment Reference</td>
              <td style="color: #fff; text-align: right; font-family: monospace; font-size: 11px;">${reference}</td>
            </tr>
            ${
              tier
                ? `<tr>
                    <td style="color: #888; padding: 8px 0;">Community Verification</td>
                    <td style="color: ${badgeColor}; text-align: right; font-weight: bold;">Verified ${VERIFICATION_TIERS[tier].label}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="https://alexanderdbridge.com/devotional" style="display: inline-block; padding: 12px 28px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 13px;">
            Return to Daily Devotional
          </a>
        </div>
      </div>
    `;

    sendEmail({
      from: getDefaultFromEmail(),
      to: userEmail,
      subject: `Your Bridge Daily ${planTitle} Membership is Confirmed! ❤️`,
      html: emailHtml,
      text: `Thank you ${userName} for supporting Bridge Daily! Reference: ${reference}`,
    }).catch((e) => console.error("Error sending Paystack confirmation email:", e));
  }

  return {
    success: true,
    plan,
    billingCycle,
    tier,
    badgeColor,
    userId,
    userEmail,
    record: subscriptionRecord,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(new URL("/devotional?error=missing_reference", request.url));
  }

  const result = await processPaymentActivation(reference);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(`/devotional?error=${encodeURIComponent(result.error || "payment_failed")}`, request.url),
    );
  }

  // Redirect back to Devotional with verified celebration query
  return NextResponse.redirect(
    new URL(`/devotional?supported=true&tier=${result.tier || "reader"}`, request.url),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { reference } = body || {};

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
    }

    const result = await processPaymentActivation(reference);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Paystack verify route POST exception:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
