/**
 * SendByte Email Integration (https://sendbyte.africa)
 * Provides transactional single email sending, multiple email dispatching, and welcome emails.
 */

import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates/welcome";

const SENDBYTE_API_URL = "https://api.sendbyte.africa/v1/emails";

export interface SendByteEmailPayload {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface BulkSendResult {
  totalTargeted: number;
  sentCount: number;
  failedCount: number;
  failedDetails: { email: string; error: string }[];
  errors: { email: string; error: string }[];
}

/**
 * Get the configured SendByte API Key from environment variables.
 */
export function getSendByteApiKey(): string | null {
  return process.env.SENDBYTE_API_KEY || process.env.RESEND_API_KEY || null;
}

/**
 * Get the default sender email address.
 */
export function getDefaultFromEmail(): string {
  return (
    process.env.SENDBYTE_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "Alexander D. Bridge <devotional@alexanderdbridge.com>"
  );
}

/**
 * Send a single email via SendByte REST API.
 */
export async function sendEmail({
  from,
  to,
  subject,
  html,
  text,
}: SendByteEmailPayload): Promise<SendEmailResult> {
  const apiKey = getSendByteApiKey();
  if (!apiKey) {
    console.warn("SendByte skipped: SENDBYTE_API_KEY is not configured.");
    return { success: false, error: "SENDBYTE_API_KEY not configured" };
  }

  const sender = from || getDefaultFromEmail();

  try {
    const res = await fetch(SENDBYTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to,
        subject,
        html,
        text,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        `SendByte HTTP ${res.status}: ${res.statusText}`;
      console.error("SendByte email sending error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      id: data?.id || data?.data?.id || "queued",
    };
  } catch (err: any) {
    console.error("Exception sending email via SendByte:", err);
    return {
      success: false,
      error: err?.message || "Failed to communicate with SendByte API",
    };
  }
}

/**
 * Send multiple emails with controlled concurrency and error isolation.
 * Allows sending personalized or broadcast emails to an array of recipients.
 */
export async function sendMultipleEmails(
  recipients: string[],
  options: {
    from?: string;
    subject: string;
    html?: string;
    text?: string;
    batchSize?: number;
  },
): Promise<BulkSendResult> {
  const uniqueRecipients = Array.from(
    new Set(
      recipients
        .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e) => e.includes("@")),
    ),
  );

  const batchSize = options.batchSize || 5;
  let sentCount = 0;
  const failedDetails: { email: string; error: string }[] = [];

  for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
    const batch = uniqueRecipients.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (email) => {
        const result = await sendEmail({
          from: options.from,
          to: email,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        if (result.success) {
          sentCount++;
        } else {
          failedDetails.push({
            email,
            error: result.error || "Unknown SendByte error",
          });
        }
      }),
    );
  }

  return {
    totalTargeted: uniqueRecipients.length,
    sentCount,
    failedCount: failedDetails.length,
    failedDetails,
    errors: failedDetails,
  };
}

/**
 * Welcome Email Trigger sent to newly registered believers.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  recipientName?: string,
  devotionalUrl?: string,
): Promise<SendEmailResult> {
  const html = getWelcomeEmailHtml(recipientName, devotionalUrl);
  const text = getWelcomeEmailText(recipientName, devotionalUrl);

  return sendEmail({
    to: toEmail,
    subject: "Welcome to Bridge Daily Devotional ❤️",
    html,
    text,
  });
}
