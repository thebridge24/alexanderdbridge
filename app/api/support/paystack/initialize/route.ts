import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { initializePaystackTransaction, getPaystackSecretKey } from "@/lib/payments/paystack";
import { getServerBaseUrl } from "@/lib/utils/auth";
import { PLAN_CONFIGS, PlanType, BillingCycle } from "@/lib/payments/plans";
import { recordPaymentTransaction } from "@/lib/payments/transactions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const {
      plan,
      billingCycle = "monthly",
      email: providedEmail,
      name: providedName,
      returnUrl,
    } = body || {};

    if (!plan || !(plan in PLAN_CONFIGS)) {
      return NextResponse.json(
        { error: "Invalid plan specified. Choose reader, supporter, sponsor, partner, or patron." },
        { status: 400 },
      );
    }

    const planConfig = PLAN_CONFIGS[plan as PlanType];
    const amountInNgn =
      billingCycle === "yearly" ? planConfig.yearlyAmount : planConfig.monthlyAmount;

    // Identify authenticated user if token is present
    const supabase = createSupabaseAdmin();
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

    if (!userEmail || !userEmail.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required for payment initialization." },
        { status: 400 },
      );
    }

    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        {
          error: "PAYSTACK_SECRET_KEY is not configured on the server.",
          isPaystackConfigured: false,
        },
        { status: 503 },
      );
    }

    const baseUrl = getServerBaseUrl(request);
    // Paystack must return to the server verification endpoint first. Sending
    // users directly to the form leaves successful payments unprocessed.
    const defaultCallback = `${baseUrl}/api/support/paystack/verify`;
    // Only same-site return URLs are honoured so payments always come back through verification
    const callbackUrl =
      typeof returnUrl === "string" && returnUrl.startsWith(baseUrl) ? returnUrl : defaultCallback;

    const result = await initializePaystackTransaction({
      email: userEmail.trim().toLowerCase(),
      amountInNgn,
      callbackUrl,
      metadata: {
        userId,
        userEmail: userEmail.trim().toLowerCase(),
        userName: userName || "Believer",
        plan,
        billingCycle,
        amountInNgn,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initialize Paystack transaction." },
        { status: 502 },
      );
    }

    await recordPaymentTransaction({
      reference: result.reference || "",
      userId,
      email: userEmail,
      plan,
      billingCycle,
      amount: amountInNgn,
      status: "pending",
      metadata: { userId, userEmail, userName: userName || "Believer", plan, billingCycle },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
      amount: amountInNgn,
      plan,
      billingCycle,
    });
  } catch (error: any) {
    console.error("Paystack initialize route error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
