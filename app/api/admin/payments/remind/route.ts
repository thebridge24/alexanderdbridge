/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import {
  getBroadcastEmailHtml,
  getBroadcastEmailText,
} from "@/lib/email/templates/broadcast";

const SUPPORT_URL = "https://alexanderdbridge.com/support";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { email, reference, planType, amount, status, note } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid recipient email is required" },
        { status: 400 },
      );
    }

    const subject = "Complete your Bridge Daily support";

    // Use the admin's custom message from the modal; fall back to a default.
    const customParagraphs =
      typeof note === "string"
        ? note
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
    const paragraphs = customParagraphs.length
      ? customParagraphs
      : [
          "Thank you for being part of Bridge Daily. We noticed that your support contribution wasn't completed, so we thought to reach out and remind you.",
          "Your support helps us keep this platform running and continue sharing God's Word with more people. If you intended to complete your contribution, you can still do so using the link below.",
        ];

    const template = {
      subject,
      paragraphs,
      ctaText: "Complete Your Support",
      ctaUrl: SUPPORT_URL,
    };

    const result = await sendEmail({
      from: getDefaultFromEmail(),
      to: email.trim().toLowerCase(),
      subject,
      html: getBroadcastEmailHtml(template),
      text: getBroadcastEmailText(template),
      metadata: {
        type: "payment_reminder",
        reference,
        planType,
        amount,
        status,
      },
    });

    if (!result.success) {
      console.error(
        `[Payment Reminder] Failed for ${email} (ref ${reference}):`,
        result.error,
      );
      return NextResponse.json(
        { error: result.error || "Failed to send reminder email" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
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
