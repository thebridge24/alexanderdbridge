import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendMultipleEmails, getSendByteApiKey, getDefaultFromEmail } from "@/lib/email/sendbyte";
import {
  getBroadcastEmailHtml,
  getBroadcastEmailText,
} from "@/lib/email/templates/broadcast";
import { sendPushToAll, sendPushToUser } from "@/lib/notifications/sender";
import { computeStreaks } from "@/lib/utils/streak";

// Audience ids the broadcaster sends: "streak_<days>" is a streak group
const STREAK_RE = /^streak_(\d+)$/;

/** Every account's email, keyed by user id (paginated). */
async function loadAuthEmails(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    data.users.forEach((u) => {
      if (u.email) emails.set(u.id, u.email.trim().toLowerCase());
    });
    if (data.users.length < perPage) break;
  }
  return emails;
}

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

    // Specific audiences: a streak group, or people picked by hand
    const streakMatch = STREAK_RE.exec(String(target));
    let targetedUserIds: string[] | null = null;
    if (streakMatch || target === "selected_users") {
      const authEmails = await loadAuthEmails(supabase);

      if (streakMatch) {
        // Same streak calculation the analytics page uses, so the counts match
        const streak = Number(streakMatch[1]);
        const { data: streakRows } = await supabase
          .from("user_streaks")
          .select("user_id, attendance_history, completed_devotionals");
        targetedUserIds = (streakRows ?? [])
          .filter((r) => computeStreaks(r.attendance_history, r.completed_devotionals).currentStreak === streak)
          .map((r) => r.user_id);
      } else {
        const picked: string[] = Array.isArray(body?.recipientEmails)
          ? body.recipientEmails
              .filter((e: unknown) => typeof e === "string")
              .map((e: string) => e.trim().toLowerCase())
          : [];
        picked.forEach((e) => {
          if (e.includes("@")) recipientEmails.add(e);
        });
        targetedUserIds = Array.from(authEmails.entries())
          .filter(([, email]) => picked.includes(email))
          .map(([id]) => id);
      }

      targetedUserIds.forEach((uid) => {
        recipientUserIds.add(uid);
        const email = authEmails.get(uid);
        if (email) recipientEmails.add(email);
      });
    }

    // Query target recipients based on target filter
    if (targetedUserIds) {
      // Filled in above
    } else if (target === "survey_respondents" || target === "willing") {
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
    } else if (target === "all_users") {
      // "all_users": collect from auth.users, notification_preferences & survey_responses
      const [authUsersRes, prefsRes, surveyRes] = await Promise.all([
        supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }).catch(() => ({ data: { users: [] } })),
        supabase.from("notification_preferences").select("user_id"),
        supabase.from("survey_responses").select("user_email, user_id"),
      ]);

      if (authUsersRes?.data?.users) {
        authUsersRes.data.users.forEach((u) => {
          if (u.email && u.email.includes("@")) {
            recipientEmails.add(u.email.trim().toLowerCase());
          }
          if (u.id) recipientUserIds.add(u.id);
        });
      }
      if (prefsRes?.data) {
        prefsRes.data.forEach((p) => p.user_id && recipientUserIds.add(p.user_id));
      }
      if (surveyRes?.data) {
        surveyRes.data.forEach((s) => {
          if (s.user_email && s.user_email.includes("@")) {
            recipientEmails.add(s.user_email.trim().toLowerCase());
          }
          if (s.user_id) recipientUserIds.add(s.user_id);
        });
      }
    } else {
      // Never fall back to everyone for an audience we don't recognise
      return NextResponse.json({ error: `Unknown audience: ${target}` }, { status: 400 });
    }

    const emailList = Array.from(recipientEmails);
    const userIdList = Array.from(recipientUserIds);
    let emailsSentCount = 0;
    let emailsFailedCount = 0;
    let emailFailedDetails: { email: string; error: string; statusCode?: number; timestamp: string }[] = [];
    let pushSentCount = 0;
    let emailError: string | null = null;

    // 1. Send Bulk Emails via SendByte if email channel requested
    if (channels.includes("email")) {
      if (emailList.length === 0) {
        emailError = "No recipient email addresses found for the selected audience.";
      } else {
        const apiKey = getSendByteApiKey();
        if (apiKey) {
          const fromEmail = getDefaultFromEmail();

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

          const result = await sendMultipleEmails(emailList, {
            from: fromEmail,
            subject: cleanSubject,
            html: htmlContent,
            text: textContent,
            metadata: { type: "admin_broadcast", target },
          });

          emailsSentCount = result.sentCount;
          emailsFailedCount = result.failedCount;
          emailFailedDetails = result.failedDetails;

          if (result.failedCount > 0) {
            emailError = `Delivered to ${result.sentCount} recipients; ${result.failedCount} email(s) failed.`;
          }
        } else {
          emailError = "SENDBYTE_API_KEY environment variable is not configured on the server.";
        }
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

      if (target === "all_users") {
        // Everyone: one push to every subscribed device
        const pushRes = await sendPushToAll(cleanSubject, summaryText, cleanCtaUrl, "admin");
        if (pushRes.ok) {
          pushSentCount = userIdList.length || 1;
        }
      } else {
        // A chosen audience: push only to those users
        for (let i = 0; i < userIdList.length; i += 10) {
          const results = await Promise.all(
            userIdList
              .slice(i, i + 10)
              .map((uid) => sendPushToUser(uid, cleanSubject, summaryText, cleanCtaUrl, "admin")),
          );
          pushSentCount += results.reduce((sum, n) => sum + n, 0);
        }
      }
    }


    return NextResponse.json({
      ok: true,
      recipientsTargeted: Math.max(emailList.length, userIdList.length),
      totalTargeted: Math.max(emailList.length, userIdList.length),
      emailsSent: emailsSentCount,
      emailsFailed: emailsFailedCount,
      failedDetails: emailFailedDetails,
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

