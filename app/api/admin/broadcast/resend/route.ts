import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { getBroadcastEmailHtml, getBroadcastEmailText } from "@/lib/email/templates/broadcast";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { emailId, email } = body || {};

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid recipient email is required" }, { status: 400 });
    }

    const defaultSubject = "A Special Word from The Bridge Devotional";
    const defaultParagraphs = [
      "Thank you for being an active part of The Bridge Daily Devotional community!",
      "We are excited to build a deeper, more enriching devotional experience for you every single day.",
    ];

    const result = await sendEmail({
      from: getDefaultFromEmail(),
      to: email.trim().toLowerCase(),
      subject: defaultSubject,
      html: getBroadcastEmailHtml({
        subject: defaultSubject,
        paragraphs: defaultParagraphs,
        ctaText: "Open Daily Devotional",
        ctaUrl: "https://alexanderdbridge.com/devotional",
      }),
      text: getBroadcastEmailText({
        subject: defaultSubject,
        paragraphs: defaultParagraphs,
        ctaText: "Open Daily Devotional",
        ctaUrl: "https://alexanderdbridge.com/devotional",
      }),
      metadata: { type: "resend_broadcast", originalEmailId: emailId },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to resend email",
          failedRecipient: email,
          reason: result.error,
        },
        { status: 502 },
      );
    }

    // If successfully resent and emailId is provided, mark original log as resent/cleared if possible
    if (emailId && isSupabaseConfigured() && !emailId.startsWith("broadcast-")) {
      try {
        const supabase = createSupabaseAdmin();
        await supabase
          .from("email_logs")
          .update({ status: "sent", error_message: "Resent successfully" })
          .eq("id", emailId);
      } catch (logErr) {
        console.warn("Could not update email_log status after resend:", logErr);
      }
    }

    return NextResponse.json({ success: true, resentTo: email, id: result.id });
  } catch (err: any) {
    console.error("Resend broadcast error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
