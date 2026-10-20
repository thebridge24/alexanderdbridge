import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { PLAN_CONFIGS, PlanType, BillingCycle } from "@/lib/payments/plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const {
      plan,
      billingCycle = "monthly",
      email: providedEmail,
      name: providedName,
    } = body || {};

    if (!plan || !["reader", "supporter", "sponsor", "patron"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified. Choose reader, supporter, sponsor, or patron." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();

    // 1. Identify User from Authorization header or body
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    let userId: string | null = null;
    let userEmail: string | null = providedEmail || null;
    let userName: string | null = providedName || null;

    if (accessToken) {
      const { data: authData } = await supabase.auth.getUser(accessToken);
      if (authData?.user) {
        userId = authData.user.id;
        userEmail = authData.user.email || userEmail;
        userName =
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          userName;
      }
    }

    // If not found from token, try looking up or finding by email
    if (!userId && userEmail) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const existing = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === userEmail?.toLowerCase(),
      );
      if (existing) {
        userId = existing.id;
        userName = existing.user_metadata?.full_name || userName;
      }
    }

    // Determine verification tier and badge attributes
    const planConfig = PLAN_CONFIGS[plan as PlanType];
    const isVerifiedPlan = planConfig?.showVerifiedIcon && plan !== "reader";
    const tier: VerificationTier | null = isVerifiedPlan
      ? (plan as VerificationTier)
      : null;
    const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;
    const amount =
      billingCycle === "yearly"
        ? planConfig?.yearlyAmount || 0
        : planConfig?.monthlyAmount || 0;

    // 2. Persist in Database (user_subscriptions) if userId exists
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
            amount,
            status: "active",
            updated_at: nowIso,
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();

      if (subError) {
        console.warn("Could not insert into user_subscriptions (table may need migration):", subError.message);
      } else {
        subscriptionRecord = subData;
      }

      // 3. Mirror verification state to Supabase Auth user metadata
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
        console.error("Failed to update user_metadata in auth:", metaErr);
      }
    }

    // 4. Send Confirmation / Thank You Email via SendByte
    if (userEmail && userEmail.includes("@")) {
      const planTitle = plan.charAt(0).toUpperCase() + plan.slice(1);
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; border-radius: 16px; padding: 32px; border: 1px solid #262626;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background: rgba(239,68,68,0.15); color: #ef4444; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
              Subscription Confirmed
            </span>
            <h1 style="font-size: 24px; font-weight: 800; margin: 16px 0 8px; color: #fff;">
              Thank You for Supporting Bridge Daily ❤️
            </h1>
            <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
              Hi ${userName || "Believer"}, your support as a <strong>${planTitle}</strong> means the world to our community.
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
              ${
                tier
                  ? `<tr>
                      <td style="color: #888; padding: 8px 0;">Community Verification</td>
                      <td style="color: ${badgeColor}; text-align: right; font-weight: bold;">Verified ${VERIFICATION_TIERS[tier].label} (${VERIFICATION_TIERS[tier].hexColor})</td>
                    </tr>`
                  : ""
              }
            </table>
          </div>

          <p style="color: #999; font-size: 13px; line-height: 1.6;">
            Your generosity helps us keep Bridge Daily running fast, distraction-free, and accessible to believers worldwide.
          </p>

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://alexanderdbridge.com/devotional" style="display: inline-block; padding: 12px 28px; background: #dc2626; color: #fff; text-decoration: none; border-radius: 9999px; font-weight: 700; font-size: 13px;">
              Return to Devotional
            </a>
          </div>
        </div>
      `;

      // Non-blocking fire-and-forget email dispatch
      sendEmail({
        from: getDefaultFromEmail(),
        to: userEmail,
        subject: `Your Bridge Daily ${planTitle} Membership is Confirmed! ❤️`,
        html: emailHtml,
        text: `Thank you ${userName || "Believer"} for becoming a ${planTitle} subscriber! Your support keeps Bridge Daily free and accessible.`,
      }).catch((e) => console.error("Error sending subscription email:", e));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan} plan`,
      subscription: {
        userId,
        plan,
        billingCycle,
        tier,
        badgeColor,
        isVerified: tier !== null,
        record: subscriptionRecord,
      },
    });
  } catch (error: any) {
    console.error("Support subscription error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process subscription" },
      { status: 500 },
    );
  }
}
