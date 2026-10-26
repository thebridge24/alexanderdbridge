import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhookSignature } from "@/lib/payments/paystack";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PlanType, BillingCycle } from "@/lib/payments/plans";
import { activateSubscriptionFromPayment } from "@/lib/subscriptions/activate";
import { recordPaymentTransaction } from "@/lib/payments/transactions";

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

    if (data?.reference && ["success", "failed", "abandoned"].includes(data.status)) {
      const transactionMetadata = data.metadata || {};
      await recordPaymentTransaction({
        reference: data.reference,
        userId: (transactionMetadata.userId as string | null) || null,
        email: data.customer?.email || (transactionMetadata.userEmail as string | null) || null,
        plan: transactionMetadata.plan as PlanType,
        billingCycle: transactionMetadata.billingCycle as BillingCycle,
        amount: (data.amount || 0) / 100,
        channel: data.channel,
        status: data.status === "success" ? "success" : data.status === "abandoned" ? "cancelled" : "failed",
        paidAt: data.paid_at,
        metadata: transactionMetadata,
      });
    }

    if (event === "charge.success" && data?.status === "success") {
      const metadata = data.metadata || {};
      const supabase = createSupabaseAdmin();
      const outcome = await activateSubscriptionFromPayment(supabase, {
        reference: data.reference,
        plan: (metadata.plan as PlanType) || "supporter",
        billingCycle: (metadata.billingCycle as BillingCycle) || "monthly",
        userId: (metadata.userId as string | null) || null,
        email: (data.customer?.email || metadata.userEmail || "").trim().toLowerCase(),
        name: (metadata.userName as string | null) || null,
        amountPaid: (data.amount || 0) / 100,
        expectedAmount: Number(metadata.amountInNgn) || null,
        channel: data.channel,
      });
      if (!outcome.activated) {
        console.error(`Webhook: ${data.reference} paid but not activated (${outcome.reason}): ${outcome.message}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json({ error: error?.message || "Webhook error" }, { status: 500 });
  }
}
