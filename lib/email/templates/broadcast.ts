/**
 * Premium HTML Email Template for Bulk Survey & Devotional Broadcasts.
 */

export interface BroadcastEmailOptions {
  subject: string;
  paragraphs: string[];
  recipientName?: string;
  ctaText?: string;
  ctaUrl?: string;
}

/**
 * Escapes sensitive HTML entities to prevent markup injection in user-entered email content.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getBroadcastEmailHtml({
  subject,
  paragraphs,
  recipientName,
  ctaText = "Open Daily Devotional",
  ctaUrl = "https://alexanderdbridge.com/devotional",
}: BroadcastEmailOptions): string {
  const safeSubject = escapeHtml(subject);
  const greeting = recipientName ? `Dear ${escapeHtml(recipientName)},` : "Hello Dear Believer,";

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.75; color: #d4d4d8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${escapeHtml(p.trim())}</p>`,
    )
    .join("");


  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030303; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030303; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #09090b; border: 1px solid #27272a; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; background: linear-gradient(180deg, #18181b 0%, #09090b 100%); border-bottom: 1px solid #1f1f23; text-align: center;">
              <!-- Emblem Logo Icon -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 16px auto;">
                <tr>
                  <td style="width: 52px; height: 52px; background-color: #1c0f13; border: 1px solid #7f1d1d; border-radius: 16px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 24px; line-height: 52px; color: #ef4444; font-weight: bold;">✝</span>
                  </td>
                </tr>
              </table>
              <span style="display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #ef4444; margin-bottom: 6px;">The Bridge Daily Devotional</span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; line-height: 1.3;">${subject}</h1>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 36px 32px 32px 32px; background-color: #09090b;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                ${greeting}
              </p>

              <!-- Body Paragraphs -->
              <div style="color: #d4d4d8;">
                ${paragraphsHtml}
              </div>

              <!-- CTA Button Card -->
              ${
                ctaUrl
                  ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; border-radius: 9999px; box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.4);">
                      ${ctaText} →
                    </a>
                  </td>
                </tr>
              </table>
              `
                  : ""
              }
            </td>
          </tr>

          <!-- Inspirational Callout Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #27272a 50%, transparent 100%);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 32px 36px 32px; background-color: #09090b; text-align: center;">
              <p style="margin: 0 0 12px 0; font-size: 13px; font-style: italic; color: #a1a1aa; line-height: 1.6;">
                “Your word is a lamp for my feet, a light for my path.”
              </p>
              <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em;">
                Psalm 119:105
              </p>

              <p style="margin: 0 0 8px 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                Sent with love from <strong>Alexander D. Bridge</strong> — The Bridge Devotional Team.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b;">
                © ${new Date().getFullYear()} The Bridge Devotional. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function getBroadcastEmailText({
  subject,
  paragraphs,
  recipientName,
  ctaText = "Open Daily Devotional",
  ctaUrl = "https://alexanderdbridge.com/devotional",
}: BroadcastEmailOptions): string {
  const greeting = recipientName ? `Dear ${recipientName},` : "Hello Dear Believer,";
  const bodyText = paragraphs.join("\n\n");
  return `${subject}\n\n${greeting}\n\n${bodyText}\n\n${ctaText}: ${ctaUrl}\n\n---\n“Your word is a lamp for my feet, a light for my path.” - Psalm 119:105\nThe Bridge Daily Devotional`;
}
