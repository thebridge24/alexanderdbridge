import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, getDefaultFromEmail } from "@/lib/email/sendbyte";
import { getSubscriptionEmail } from "@/lib/email/templates/subscription";
import { sendNotification } from "@/lib/notifications/sender";

/** Days before the end of a plan that a reminder goes out. */
export const REMINDER_DAYS = [7, 5, 3, 2, 1];
/** Days a subscriber keeps their badge after the plan ends before going back to the free level. */
export const GRACE_DAYS = 3;

const DAY_MS = 86_400_000;

export interface LifecycleResult {
  checked: number;
  reminders: number;
  graceNotices: number;
  downgraded: number;
  errors: string[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

async function notify(
  sub: any,
  kind: "reminder" | "grace" | "removed",
  data: { daysLeft?: number; graceDaysLeft?: number },
  dedupe: string,
) {
  const planTitle = titleCase(sub.plan_type);
  const email = getSubscriptionEmail(kind, {
    name: sub.user_name || "Believer",
    planTitle,
    expiresOn: formatDate(sub.expires_at),
    daysLeft: data.daysLeft,
    graceDaysLeft: data.graceDaysLeft,
  });

  let title = "";
  let body = "";
  if (kind === "reminder") {
    title = `Your ${planTitle} plan ends ${data.daysLeft === 1 ? "tomorrow" : `in ${data.daysLeft} days`}`;
    body = "Renew now to keep your verified badge.";
  } else if (kind === "grace") {
    title = `Your ${planTitle} plan has ended`;
    body = `You have ${data.graceDaysLeft} days of grace to renew before your badge is removed.`;
  } else {
    title = `Your ${planTitle} plan has ended`;
    body = "Your account is back to the free level. Renew any time to get your badge back.";
  }

  // In-app + device push ("admin" type so notification preferences never hide billing notices)
  await sendNotification({
    userId: sub.user_id,
    type: "admin",
    title,
    body,
    link: "/devotional",
    dedupeKey: dedupe,
    push: true,
  });

  if (sub.user_email && sub.user_email.includes("@")) {
    const res = await sendEmail({
      from: getDefaultFromEmail(),
      to: sub.user_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
    if (!res.success) {
      console.error(`Subscription ${kind} email failed for ${sub.user_email}:`, res.error);
      return res;
    }
    return res;
  }
  return null;
}

/** Sends one reminder email + notification right now (used by the admin "Send reminder" button). */
export async function sendReminderNow(sub: any) {
  const daysLeft = Math.max(1, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / DAY_MS));
  const res = await notify(sub, "reminder", { daysLeft }, `sub-manual:${sub.id}:${Date.now()}`);
  if (res && !res.success) throw new Error(res.error || "Email could not be sent");
  if (!res) throw new Error("This subscriber has no email address on file.");
}

/**
 * Walks every active subscription and, idempotently:
 *  - sends a reminder at 7, 5, 3, 2 and 1 day(s) before the plan ends (each at most once),
 *  - sends a grace notice when the plan ends (badge stays for GRACE_DAYS),
 *  - after the grace period, returns the user to the free level and tells them.
 * Safe to call as often as you like; flags on the row stop duplicates.
 */
export async function processSubscriptionLifecycle(supabase: SupabaseClient): Promise<LifecycleResult> {
  const result: LifecycleResult = { checked: 0, reminders: 0, graceNotices: 0, downgraded: 0, errors: [] };

  const { data: subs, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("status", "active")
    .not("expires_at", "is", null);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const now = Date.now();

  for (const sub of subs ?? []) {
    result.checked += 1;
    try {
      const expiresMs = new Date(sub.expires_at).getTime();
      const sent: number[] = Array.isArray(sub.reminders_sent) ? sub.reminders_sent : [];

      // 1. Before the end: 7/5/3/2/1-day reminders
      if (now < expiresMs) {
        const daysLeft = Math.ceil((expiresMs - now) / DAY_MS);
        const bucket = [...REMINDER_DAYS].sort((a, b) => a - b).find((d) => daysLeft <= d);
        if (bucket !== undefined && !sent.includes(bucket)) {
          // Mark this bucket and every larger one so a late run can't send several at once
          const updatedSent = Array.from(new Set([...sent, ...REMINDER_DAYS.filter((d) => d >= bucket)]));
          await supabase.from("user_subscriptions").update({ reminders_sent: updatedSent }).eq("id", sub.id);
          await notify(sub, "reminder", { daysLeft }, `sub-reminder:${sub.id}:${sub.expires_at}:${bucket}`);
          result.reminders += 1;
        }
        continue;
      }

      const graceEndsMs = expiresMs + GRACE_DAYS * DAY_MS;

      // 2. Plan ended, still inside the grace period: tell them once, keep the badge
      if (now < graceEndsMs) {
        if (!sub.grace_notified) {
          await supabase.from("user_subscriptions").update({ grace_notified: true }).eq("id", sub.id);
          const graceDaysLeft = Math.max(1, Math.ceil((graceEndsMs - now) / DAY_MS));
          await notify(sub, "grace", { graceDaysLeft }, `sub-grace:${sub.id}:${sub.expires_at}`);
          result.graceNotices += 1;
        }
        continue;
      }

      // 3. Grace over: back to the free level
      await supabase
        .from("user_subscriptions")
        .update({
          status: "expired",
          verification_tier: null,
          badge_color: null,
          expired_notified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      try {
        await supabase.auth.admin.updateUserById(sub.user_id, {
          user_metadata: {
            is_verified: false,
            verification_tier: null,
            badge_color: null,
            support_plan: null,
          },
        });
      } catch (metaErr) {
        console.error("Failed to clear auth metadata for expired subscription:", metaErr);
      }

      if (!sub.expired_notified) {
        await notify(sub, "removed", {}, `sub-expired:${sub.id}:${sub.expires_at}`);
      }
      result.downgraded += 1;
    } catch (err: any) {
      console.error(`Subscription lifecycle failed for ${sub.id}:`, err);
      result.errors.push(`${sub.id}: ${err?.message || "unknown error"}`);
    }
  }

  return result;
}
