import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { verifyPaystackTransaction } from "@/lib/payments/paystack";
import { VERIFICATION_TIERS, VerificationTier } from "@/lib/utils/verification";
import { getServerBaseUrl } from "@/lib/utils/auth";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions/activate";
import { PlanType, BillingCycle } from "@/lib/payments/plans";
import { recordPaymentTransaction } from "@/lib/payments/transactions";

async function processPaymentActivation(reference: string) {
  const result = await verifyPaystackTransaction(reference);

  const metadata = result.metadata || {};
  const transactionStatus =
    result.status === "success"
      ? "success"
      : result.status === "abandoned"
        ? "cancelled"
        : result.status === "failed"
          ? "failed"
          : "pending";

  if (result.status) {
    await recordPaymentTransaction({
      reference,
      userId: (metadata.userId as string | null) || null,
      email: result.customerEmail || (metadata.userEmail as string | null) || null,
      plan: metadata.plan as PlanType,
      billingCycle: metadata.billingCycle as BillingCycle,
      amount: result.amountInNgn,
      channel: result.channel,
      status: transactionStatus,
      paidAt: result.paidAt,
      metadata,
    });
  }

  if (!result.success || result.status !== "success") {
    return {
      success: false,
      error: result.error || `Payment status is ${result.status || "unsuccessful"}`,
    };
  }

  const plan = (metadata.plan as PlanType) || "supporter";
  const billingCycle = (metadata.billingCycle as BillingCycle) || "monthly";
  const userEmail = (result.customerEmail || metadata.userEmail || "").trim().toLowerCase();
  const amountPaid = result.amountInNgn || 0;

  const supabase = createSupabaseAdmin();
  const outcome = await activateSubscriptionFromPayment(supabase, {
    reference,
    plan,
    billingCycle,
    userId: (metadata.userId as string | null) || null,
    email: userEmail,
    name: (metadata.userName as string | null) || null,
    amountPaid,
    // What the checkout asked for; the plan price is the fallback for older transactions
    expectedAmount: Number(metadata.amountInNgn) || null,
    channel: result.channel,
  });

  if (!outcome.activated) {
    console.error(`Paystack ${reference} paid but not activated (${outcome.reason}): ${outcome.message}`);
    // The money was received. Only a real underpayment is reported as a failure.
    if (outcome.reason === "amount_mismatch") {
      return { success: false, error: outcome.message };
    }
    return {
      success: true,
      plan,
      billingCycle,
      tier: null,
      badgeColor: null,
      userId: null,
      userEmail,
      record: null,
      pendingLink: outcome.reason === "no_account",
    };
  }

  return {
    success: true,
    plan: outcome.plan,
    billingCycle: outcome.billingCycle,
    tier: outcome.tier,
    badgeColor: outcome.tier ? VERIFICATION_TIERS[outcome.tier].hexColor : null,
    userId: outcome.userId,
    userEmail,
    record: outcome.record,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const baseUrl = getServerBaseUrl(request);

  if (!reference) {
    return NextResponse.redirect(new URL("/support/verify?payment=failed", baseUrl));
  }

  const result = await processPaymentActivation(reference);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(
        `/support/verify?payment=failed&error=${encodeURIComponent(result.error || "payment_failed")}`,
        baseUrl,
      ),
    );
  }

  // Show the verified result on the payment verification page. The previous
  // redirect went to /devotional, which did not consume these query params.
  return NextResponse.redirect(
    new URL(
      `/support/verify?verified=true&plan=${encodeURIComponent(result.plan || "supporter")}&cycle=${encodeURIComponent(result.billingCycle || "monthly")}&reference=${encodeURIComponent(reference)}`,
      baseUrl,
    ),
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
