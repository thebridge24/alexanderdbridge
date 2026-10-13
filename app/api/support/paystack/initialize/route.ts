import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { initializePaystackTransaction, getPaystackSecretKey } from "@/lib/payments/paystack";
import { getServerBaseUrl } from "@/lib/utils/auth";
import { PLAN_CONFIGS, PlanType, BillingCycle } from "@/app/components/support/SupportPlanCard";

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

    if (!plan || !["reader", "supporter", "sponsor", "patron"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan specified. Choose reader, supporter, sponsor, or patron." },
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
    const defaultCallback = `${baseUrl}/support/verify`;
    const callbackUrl = returnUrl || defaultCallback;

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
