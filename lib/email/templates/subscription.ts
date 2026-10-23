import { getServerBaseUrl } from "@/lib/utils/auth";

type Kind = "started" | "reminder" | "grace" | "removed";

interface TemplateInput {
  name: string;
  planTitle: string;
  expiresOn: string; // human readable
  daysLeft?: number;
  graceDaysLeft?: number;
  complimentary?: boolean;
}

function shell(badge: string, badgeColor: string, heading: string, intro: string, rows: string, footer: string, cta: string) {
  const url = `${getServerBaseUrl()}/devotional`;
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#000;color:#fff;border-radius:16px;padding:32px;border:1px solid #262626;">
  <div style="text-align:center;margin-bottom:24px;">
    <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:${badgeColor}22;color:${badgeColor};font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;">${badge}</span>
    <h1 style="font-size:24px;font-weight:800;margin:16px 0 8px;color:#fff;">${heading}</h1>
    <p style="color:#a3a3a3;font-size:14px;margin:0;">${intro}</p>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">${rows}</table>
  </div>
  <p style="color:#999;font-size:13px;line-height:1.6;">${footer}</p>
  <div style="text-align:center;margin-top:32px;">
    <a href="${url}" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#fff;text-decoration:none;border-radius:9999px;font-weight:700;font-size:13px;">${cta}</a>
  </div>
</div>`;
}

const row = (label: string, value: string) =>
  `<tr><td style="color:#888;padding:8px 0;">${label}</td><td style="color:#fff;text-align:right;font-weight:bold;">${value}</td></tr>`;

export function getSubscriptionEmail(kind: Kind, i: TemplateInput): { subject: string; html: string; text: string } {
  const name = i.name || "Believer";

  if (kind === "started") {
    const subject = `You're now a Bridge Daily ${i.planTitle} 🎉`;
    const intro = i.complimentary
      ? `Hi ${name}, you've been given a complimentary <strong>${i.planTitle}</strong> membership. Thank you for being part of this community.`
      : `Hi ${name}, your <strong>${i.planTitle}</strong> subscription is now active. Thank you for supporting Bridge Daily.`;
    return {
      subject,
      html: shell("Subscription Active", "#10b981", "Welcome aboard ❤️", intro,
        row("Plan", i.planTitle) + row("Active until", i.expiresOn),
        "Your verified badge now shows next to your name across the community.", "Return to Devotional"),
      text: `Hi ${name}, you are now a Bridge Daily ${i.planTitle}. Active until ${i.expiresOn}.`,
    };
  }

  if (kind === "reminder") {
    const d = i.daysLeft ?? 0;
    const when = d === 1 ? "tomorrow" : `in ${d} days`;
    return {
      subject: `Your ${i.planTitle} plan ends ${when}`,
      html: shell("Plan Ending Soon", "#f59e0b", `Your plan ends ${when}`,
        `Hi ${name}, your <strong>${i.planTitle}</strong> membership ends on <strong>${i.expiresOn}</strong>.`,
        row("Plan", i.planTitle) + row("Ends on", i.expiresOn) + row("Days left", String(d)),
        "Renew before it ends to keep your verified badge and supporter perks without a break.", "Renew Now"),
      text: `Hi ${name}, your ${i.planTitle} plan ends on ${i.expiresOn} (${d} day${d === 1 ? "" : "s"} left). Renew to keep your badge.`,
    };
  }

  if (kind === "grace") {
    const g = i.graceDaysLeft ?? 3;
    return {
      subject: `Your ${i.planTitle} plan has ended — ${g} days to renew`,
      html: shell("Grace Period", "#f59e0b", "Your plan has ended", 
        `Hi ${name}, your <strong>${i.planTitle}</strong> membership ended on ${i.expiresOn}. We've kept your badge active for ${g} more days.`,
        row("Plan", i.planTitle) + row("Ended on", i.expiresOn) + row("Grace days left", String(g)),
        "Renew within the grace period and nothing changes. After that your account returns to the free level.", "Renew Now"),
      text: `Hi ${name}, your ${i.planTitle} plan ended on ${i.expiresOn}. You have ${g} days of grace to renew before your badge is removed.`,
    };
  }

  return {
    subject: `Your ${i.planTitle} plan has ended`,
    html: shell("Plan Ended", "#ef4444", "We'll miss your support",
      `Hi ${name}, your <strong>${i.planTitle}</strong> membership and grace period have ended, so your account is back to the free level.`,
      row("Plan", i.planTitle) + row("Ended on", i.expiresOn),
      "You can come back any time and your badge returns the moment you renew. Thank you for everything you've given.", "Renew Membership"),
    text: `Hi ${name}, your ${i.planTitle} plan has ended and your account is back to the free level. Renew any time to get your badge back.`,
  };
}
