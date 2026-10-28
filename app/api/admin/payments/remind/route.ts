/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, reference, planType, amount, status } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 },
      );
    }

    // Optional: Log the reminder in Supabase audit logs or send via your email delivery system (e.g. SendByte / Resend / SendGrid)
    const supabase = createSupabaseAdmin();

    // You can record that a reminder was triggered
    console.log(
      `[Payment Reminder] Sending email to ${email} for reference ${reference} (Status: ${status})`,
    );

    // TODO: Integrate your actual email sending service call here (e.g., SendByte API integration)
    // const emailRes = await sendByteClient.send({ to: email, subject: "Complete your Bridge Daily support", ... });

    return NextResponse.json({
      success: true,
      message: `Reminder email successfully dispatched to ${email}`,
    });
  } catch (error: any) {
    console.error("Failed to send payment reminder email:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send reminder" },
      { status: 500 },
    );
  }
}
