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

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid subject string is required" },
        { status: 400 },
      );
    }

    if (!paragraphs || !Array.isArray(paragraphs) || paragraphs.length === 0) {
      return NextResponse.json(
        { error: "Paragraphs array must contain at least one text block" },
        { status: 400 },
      );
    }

    const cleanSubject = subject.trim().slice(0, 200);
    const cleanParagraphs = paragraphs
      .map((p) => (typeof p === "string" ? p.trim() : ""))
      .filter((p) => p.length > 0)
      .slice(0, 20);

    if (cleanParagraphs.length === 0) {
      return NextResponse.json(
        { error: "At least one non-empty paragraph is required" },
        { status: 400 },
      );
    }

    const cleanCtaText = (typeof ctaText === "string" ? ctaText.trim() : "Open Daily Devotional").slice(0, 100);
    const cleanCtaUrl = (typeof ctaUrl === "string" ? ctaUrl.trim() : "/devotional").slice(0, 500);


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
          subject: cleanSubject,
          paragraphs: cleanParagraphs,
          ctaText: cleanCtaText,
          ctaUrl: cleanCtaUrl,
        });

        const textContent = getBroadcastEmailText({
          subject: cleanSubject,
          paragraphs: cleanParagraphs,
          ctaText: cleanCtaText,
          ctaUrl: cleanCtaUrl,
        });

        // Send emails in batches to optimize throughput while respecting provider rate limits
        const BATCH_SIZE = 5;
        const failedEmails: string[] = [];

        for (let i = 0; i < emailList.length; i += BATCH_SIZE) {
          const batch = emailList.slice(i, i + BATCH_SIZE);
          await Promise.all(
            batch.map(async (email) => {
              try {
                const res = await resend.emails.send({
                  from: fromEmail,
                  to: [email],
                  subject: cleanSubject,
                  html: htmlContent,
                  text: textContent,
                });
                if (res.data?.id) {
                  emailsSentCount++;
                } else if (res.error) {
                  failedEmails.push(email);
                }
              } catch (e: any) {
                console.error(`Failed to send email to ${email}:`, e);
                failedEmails.push(email);
              }
            }),
          );
        }

        if (failedEmails.length > 0) {
          emailError = `Delivered to ${emailsSentCount} recipients; failed for ${failedEmails.length} addresses.`;
        }
      } else {
        emailError = "RESEND_API_KEY is not configured";
      }
    }


    // 2. Send Bulk Push & Insert In-App Notifications if push channel requested
    if (channels.includes("push")) {
      const summaryText = cleanParagraphs[0] || cleanSubject;

      // Insert in-app notification rows into notification_events for each recipient user
      if (userIdList.length > 0) {
        const notifInserts = userIdList.map((uid) => ({
          user_id: uid,
          type: "admin",
          title: cleanSubject,
          body: summaryText,
          link: cleanCtaUrl,
        }));

        await supabase.from("notification_events").insert(notifInserts);
      }

      // Broadcast device push to all devices via Pusher Beams
      const pushRes = await sendPushToAll(cleanSubject, summaryText, cleanCtaUrl, "admin");
      if (pushRes.ok) {
        pushSentCount = userIdList.length || 1;
      }
    }


    return NextResponse.json({
      ok: true,
      recipientsTargeted: Math.max(emailList.length, userIdList.length),
      totalTargeted: Math.max(emailList.length, userIdList.length),
      emailsSent: emailsSentCount,
      pushSent: pushSentCount,
      inAppNotificationsInserted: channels.includes("push") ? userIdList.length : 0,
      emailError,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Bulk broadcast API error:", err);
    return NextResponse.json({ error: err.message || "Broadcast failed" }, { status: 500 });
  }
}

