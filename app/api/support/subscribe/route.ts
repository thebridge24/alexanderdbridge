import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { PLAN_CONFIGS, PlanType } from "@/lib/payments/plans";
import { buildPeriodFields } from "@/lib/subscriptions/period";
import { findUserIdByEmail } from "@/lib/subscriptions/activate";
import { getSubscriptionEmail } from "@/lib/email/templates/subscription";
import { sendNotification } from "@/lib/notifications/sender";

const VALID_PLANS = ["reader", "supporter", "sponsor", "partner", "patron", "visionary"];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Admin dashboard list: every subscription in the shape the Subscriptions page expects. */
export async function GET() {
  try {
    const supabase = createSupabaseAdmin();
    const { data: rows, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    // Every registered user (paginated): used for lookups and as the base for the subscriber ratio
    const allUsers: any[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data: authData, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError || !authData?.users?.length) break;
      allUsers.push(...authData.users);
      if (authData.users.length < 1000) break;
    }
    const authMap = new Map(allUsers.map((u) => [u.id, u]));

    const subscriptions = (rows ?? []).map((r) => {
      const meta = authMap.get(r.user_id)?.user_metadata ?? {};
      const complimentary = Boolean(r.is_complimentary);
      let status: "Active" | "Expired" | "Pending" | "Cancelled" | "Complimentary";
      if (r.status === "active") status = complimentary ? "Complimentary" : "Active";
      else if (r.status === "pending_review") status = "Pending";
      else if (r.status === "canceled") status = "Cancelled";
      else status = "Expired";

      return {
        id: r.id,
        userId: r.user_id,
        userName: r.user_name || meta.full_name || meta.name || r.user_email || "Anonymous",
        email: r.user_email || authMap.get(r.user_id)?.email || "",
        avatarUrl: meta.avatar_url || meta.picture || undefined,
        planName: r.plan_type.charAt(0).toUpperCase() + r.plan_type.slice(1),
        billingCycle: r.billing_cycle,
        amount: r.amount || 0,
        currency: "NGN",
        startDate: (r.started_at || r.created_at || "").slice(0, 10),
        nextPaymentDate: complimentary ? undefined : r.expires_at?.slice(0, 10),
        expiryDate: r.expires_at?.slice(0, 10),
        paymentMethod: complimentary
          ? "Complimentary"
          : r.payment_method || (r.paystack_reference ? "Paystack" : "Other"),
        status,
        paystackRef: r.paystack_reference || undefined,
        isComplimentary: complimentary,
        tier: r.verification_tier || undefined,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({ subscriptions, totalUsers: allUsers.length });
  } catch (error: any) {
    console.error("Failed to list subscriptions:", error);
    return NextResponse.json({ error: error?.message || "Failed to load subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const {
      billingCycle = "monthly",
      email: providedEmail,
      name: providedName,
      userId: adminUserId,
      isComplimentary = false,
      durationMonths,
      paymentMethod: adminPaymentMethod,
      paystackRef,
    } = body || {};
    // The admin form sends "planName" ("Supporter"), the public flow sends "plan" ("supporter")
    const plan: string | undefined = (body?.plan || body?.planName || "").toString().toLowerCase() || undefined;
    const isAdminGrant = Boolean(adminUserId);

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified. Choose reader, supporter, sponsor, partner, patron, or visionary." },
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

    // Admin grant: look the user up by id so the confirmation goes to their email
    if (isAdminGrant) {
      const { data: target, error: targetError } = await supabase.auth.admin.getUserById(adminUserId);
      if (targetError || !target?.user) {
        return NextResponse.json({ error: "Selected user was not found." }, { status: 404 });
      }
      userId = target.user.id;
      userEmail = target.user.email || userEmail;
      userName =
        target.user.user_metadata?.full_name || target.user.user_metadata?.name || userName;
    }

    // If not found from token, try looking up or finding by email
    if (!userId && userEmail) {
      const existing = await findUserIdByEmail(supabase, userEmail);
      if (existing) {
        userId = existing.id;
        userName = existing.name || userName;
      }
    }

    // Determine verification tier and badge attributes
    const planConfig = PLAN_CONFIGS[plan as PlanType];
    const isVerifiedPlan = planConfig?.showVerifiedIcon && plan !== "reader";
    const tier: VerificationTier | null = isVerifiedPlan
      ? (plan as VerificationTier)
      : null;
    const badgeColor = tier ? VERIFICATION_TIERS[tier].hexColor : null;
    const amount = isAdminGrant && isComplimentary
      ? 0
      : isAdminGrant && Number(body?.amount) > 0
        ? Number(body.amount)
        : billingCycle === "yearly"
          ? planConfig?.yearlyAmount || 0
          : planConfig?.monthlyAmount || 0;
    const months =
      isAdminGrant && isComplimentary && Number(durationMonths) > 0 ? Number(durationMonths) : undefined;

    // 2. Persist in Database (user_subscriptions) if userId exists
    let subscriptionRecord = null;
    if (userId) {
      const nowIso = new Date().toISOString();
      const period = await buildPeriodFields(supabase, userId, {
        cycle: billingCycle === "yearly" ? "yearly" : "monthly",
        months,
        reference: paystackRef || null,
      });
      const { data: subData, error: subError } = await supabase
        .from("user_subscriptions")
        .upsert(
          {
            ...period,
            user_name: userName,
            is_complimentary: Boolean(isAdminGrant && isComplimentary),
            payment_method: isAdminGrant
              ? isComplimentary
                ? "Complimentary"
                : adminPaymentMethod || "Other"
              : "Other",
            paystack_reference: paystackRef || undefined,
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
    if (isAdminGrant && userEmail && userEmail.includes("@")) {
      // Admin added this subscriber: tell them with the new template and an in-app notification
      const planTitle = plan.charAt(0).toUpperCase() + plan.slice(1);
      const expiresOn = subscriptionRecord?.expires_at ? formatDate(subscriptionRecord.expires_at) : "your next renewal";
      const mail = getSubscriptionEmail("started", {
        name: userName || "Believer",
        planTitle,
        expiresOn,
        complimentary: Boolean(isComplimentary),
      });
      const emailResult = await sendEmail({
        from: getDefaultFromEmail(),
        to: userEmail,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }).catch((e) => ({ success: false, error: String(e) }));
      if (!emailResult.success) {
        console.error("Subscription confirmation email failed:", (emailResult as any).error);
      }
      if (userId) {
        await sendNotification({
          userId,
          type: "admin",
          title: `You're now a ${planTitle} 🎉`,
          body: `Your subscription is active until ${expiresOn}.`,
          link: "/devotional",
          dedupeKey: `sub-started:${userId}:${subscriptionRecord?.expires_at || Date.now()}`,
          push: true,
        }).catch((e) => console.error("Subscription notification failed:", e));
      }
    } else if (userEmail && userEmail.includes("@")) {
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
        expiresAt: subscriptionRecord?.expires_at ?? null,
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
