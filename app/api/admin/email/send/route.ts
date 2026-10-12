import { NextRequest, NextResponse } from "next/server";
import { sendMultipleEmails, sendEmail, getDefaultFromEmail, getSendByteApiKey } from "@/lib/email/sendbyte";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = getSendByteApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "SENDBYTE_API_KEY environment variable is not configured on the server." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    const {
      to,
      recipients,
      subject,
      html,
      text,
      from = getDefaultFromEmail(),
    } = body || {};

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json({ error: "Email subject is required" }, { status: 400 });
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: "Either html or text message body is required" },
        { status: 400 },
      );
    }

    // Support single recipient or multiple recipient list
    const recipientList: string[] = [];
    if (Array.isArray(recipients)) {
      recipientList.push(...recipients);
    } else if (typeof recipients === "string") {
      recipientList.push(recipients);
    }

    if (Array.isArray(to)) {
      recipientList.push(...to);
    } else if (typeof to === "string") {
      recipientList.push(to);
    }

    const uniqueRecipients = Array.from(
      new Set(
        recipientList
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter((e) => e.includes("@")),
      ),
    );

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { error: "No valid recipient email addresses provided" },
        { status: 400 },
      );
    }

    // If single recipient, send directly
    if (uniqueRecipients.length === 1) {
      const result = await sendEmail({
        from,
        to: uniqueRecipients[0],
        subject,
        html,
        text,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Failed to send email via SendByte" },
          { status: 502 },
        );
      }

      return NextResponse.json({
        success: true,
        sentCount: 1,
        id: result.id,
      });
    }

    // Multiple recipients with batching
    const result = await sendMultipleEmails(uniqueRecipients, {
      from,
      subject,
      html,
      text,
    });

    return NextResponse.json({
      success: result.failedCount === 0,
      totalTargeted: result.totalTargeted,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      errors: result.failedDetails,
    });
  } catch (error: any) {
    console.error("Multiple email send error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
