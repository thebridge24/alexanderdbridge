import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";
import {
  getBroadcastEmailHtml,
  getBroadcastEmailText,
} from "@/lib/email/templates/broadcast";
import { sendPushToAll } from "@/lib/notifications/sender";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const {
      subject,
      paragraphs,
      target = "survey_respondents",
      channels = ["email", "push"],
      ctaText = "Open Daily Devotional",
      ctaUrl = "/devotional",
    } = body || {};

    if (!subject || !paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "subject and paragraphs array are required" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdmin();
    const recipientEmails = new Set<string>();
    const recipientUserIds = new Set<string>();

    // Query target recipients based on target filter
    if (target === "survey_respondents" || target === "willing") {
      let query = supabase.from("survey_responses").select("user_email, user_id, answers");
      const { data: responses, error } = await query;

      if (!error && responses) {
        responses.forEach((r) => {
          if (target === "willing") {
            const willing = r.answers?.membership_willingness;
            if (willing !== "yes_definitely" && willing !== "maybe") return;
          }
          if (r.user_email && r.user_email.includes("@")) {
            recipientEmails.add(r.user_email.trim().toLowerCase());
          }
          if (r.user_id) {
            recipientUserIds.add(r.user_id);
          }
        });
      }
    } else {
      // "all_users": collect from notification_preferences & survey_responses
      const [prefsRes, surveyRes] = await Promise.all([
        supabase.from("notification_preferences").select("user_id"),
        supabase.from("survey_responses").select("user_email, user_id"),
      ]);

      if (prefsRes.data) {
        prefsRes.data.forEach((p) => p.user_id && recipientUserIds.add(p.user_id));
      }
      if (surveyRes.data) {
        surveyRes.data.forEach((s) => {
          if (s.user_email && s.user_email.includes("@")) {
            recipientEmails.add(s.user_email.trim().toLowerCase());
          }
          if (s.user_id) recipientUserIds.add(s.user_id);
        });
      }
    }

    const emailList = Array.from(recipientEmails);
    const userIdList = Array.from(recipientUserIds);
    let emailsSentCount = 0;
    let pushSentCount = 0;
    let emailError: string | null = null;

    // 1. Send Bulk Emails via Resend if email channel requested
    if (channels.includes("email") && emailList.length > 0) {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const fromEmail =
          process.env.RESEND_FROM_EMAIL ||
          "Alexander D. Bridge <devotional@alexanderdbridge.com>";

        const htmlContent = getBroadcastEmailHtml({
          subject,
          paragraphs,
          ctaText,
          ctaUrl,
        });

        const textContent = getBroadcastEmailText({
          subject,
          paragraphs,
          ctaText,
          ctaUrl,
        });

        // Send email to each recipient
        for (const email of emailList) {
          try {
            const res = await resend.emails.send({
              from: fromEmail,
              to: [email],
              subject,
              html: htmlContent,
              text: textContent,
            });
            if (res.data?.id) {
              emailsSentCount++;
            }
          } catch (e: any) {
            console.error(`Failed to send email to ${email}:`, e);
          }
        }
      } else {
        emailError = "RESEND_API_KEY is not configured";
      }
    }

    // 2. Send Bulk Push & Insert In-App Notifications if push channel requested
    if (channels.includes("push")) {
      const summaryText = paragraphs[0] || subject;

      // Insert in-app notification rows into notification_events for each recipient user
      if (userIdList.length > 0) {
        const notifInserts = userIdList.map((uid) => ({
          user_id: uid,
          type: "admin",
          title: subject,
          body: summaryText,
          link: ctaUrl,
        }));

        await supabase.from("notification_events").insert(notifInserts);
      }

      // Broadcast device push to all devices via Pusher Beams
      const pushRes = await sendPushToAll(subject, summaryText, ctaUrl, "admin");
      if (pushRes.ok) {
        pushSentCount = userIdList.length || 1;
      }
    }

    return NextResponse.json({
      ok: true,
      recipientsTargeted: Math.max(emailList.length, userIdList.length),
      emailsSent: emailsSentCount,
      pushSent: pushSentCount,
      emailError,
    });
  } catch (err: any) {
    console.error("Bulk broadcast API error:", err);
    return NextResponse.json({ error: err.message || "Broadcast failed" }, { status: 500 });
  }
}
