/**
 * SendByte Email Integration (https://sendbyte.africa)
 * Provides transactional single email sending, multiple email dispatching, welcome emails,
 * and comprehensive error logging to both console and the database.
 */

import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates/welcome";
import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

const SENDBYTE_API_URL = "https://api.sendbyte.africa/v1/emails";

export interface SendByteEmailPayload {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  statusCode?: number;
  recipient?: string;
  details?: any;
}

export interface EmailFailureDetail {
  email: string;
  error: string;
  statusCode?: number;
  timestamp: string;
}

export interface BulkSendResult {
  totalTargeted: number;
  sentCount: number;
  failedCount: number;
  failedDetails: EmailFailureDetail[];
  errors: EmailFailureDetail[];
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
 * Parses and formats detailed error messages returned from SendByte API or fetch failures.
 */
function extractSendByteError(data: any, res?: Response): string {
  if (data) {
    if (typeof data === "string" && data.trim()) return data.trim();
    if (data.errors && typeof data.errors === "object") {
      const errorEntries = Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join("; ");
      if (errorEntries) {
        return data.message ? `${data.message} (${errorEntries})` : errorEntries;
      }
    }
    if (data.message && typeof data.message === "string") return data.message;
    if (data.error && typeof data.error === "string") return data.error;
    if (data.detail && typeof data.detail === "string") return data.detail;
  }
  if (res) {
    return `SendByte HTTP ${res.status}: ${res.statusText || "Request failed"}`;
  }
  return "Unknown SendByte delivery failure";
}

/**
 * Logs email delivery successes and failures to console and the Supabase email_logs table.
 */
export async function logEmailDelivery({
  recipient,
  sender,
  subject,
  status,
  errorMessage,
  errorDetails,
  sendbyteId,
  metadata,
}: {
  recipient: string;
  sender: string;
  subject: string;
  status: "sent" | "failed";
  errorMessage?: string;
  errorDetails?: any;
  sendbyteId?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const timestamp = new Date().toISOString();

  // 1. Structured Console Logging (Immediately visible in server logs & monitoring)
  if (status === "failed") {
    console.error(
      `[SendByte EMAIL FAILED] [${timestamp}] Recipient: "${recipient}" | Subject: "${subject}" | Reason: "${errorMessage}" | Details:`,
      errorDetails || "None",
    );
  } else {
    console.log(
      `[SendByte EMAIL SENT] [${timestamp}] Recipient: "${recipient}" | Subject: "${subject}" | ID: ${sendbyteId || "queued"}`,
    );
  }

  // 2. Persist to Supabase email_logs table for administrative auditing
  try {
    if (isSupabaseConfigured()) {
      const supabase = createSupabaseAdmin();
      await supabase.from("email_logs").insert({
        recipient,
        sender,
        subject,
        status,
        error_message: errorMessage || null,
        error_details: errorDetails ? JSON.stringify(errorDetails) : null,
        sendbyte_id: sendbyteId || null,
        metadata: metadata || null,
        created_at: timestamp,
      });
    }
  } catch (err: any) {
    // Non-fatal: if table does not exist or network error, warning is logged
    console.warn("[SendByte Logger] Could not record to email_logs table:", err?.message);
  }
}

/**
 * Send a single email via SendByte REST API.
 * Automatically logs failures and successes.
 */
export async function sendEmail({
  from,
  to,
  subject,
  html,
  text,
  metadata,
}: SendByteEmailPayload): Promise<SendEmailResult> {
  const sender = from || getDefaultFromEmail();
  const recipientStr = Array.isArray(to) ? to.join(", ") : to;

  const apiKey = getSendByteApiKey();
  if (!apiKey) {
    const errorMsg = "SENDBYTE_API_KEY environment variable is not configured on the server.";
    console.warn("SendByte skipped:", errorMsg);

    await logEmailDelivery({
      recipient: recipientStr,
      sender,
      subject,
      status: "failed",
      errorMessage: errorMsg,
      metadata,
    });

    return {
      success: false,
      error: errorMsg,
      recipient: recipientStr,
    };
  }

  if (!to || (Array.isArray(to) && to.length === 0)) {
    const errorMsg = "No recipient email address specified.";
    await logEmailDelivery({
      recipient: "(empty)",
      sender,
      subject,
      status: "failed",
      errorMessage: errorMsg,
      metadata,
    });
    return { success: false, error: errorMsg };
  }

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
      const errorMsg = extractSendByteError(data, res);
      await logEmailDelivery({
        recipient: recipientStr,
        sender,
        subject,
        status: "failed",
        errorMessage: errorMsg,
        errorDetails: data,
        metadata,
      });

      return {
        success: false,
        error: errorMsg,
        statusCode: res.status,
        details: data,
        recipient: recipientStr,
      };
    }

    const sendbyteId = data?.id || data?.data?.id || "queued";
    await logEmailDelivery({
      recipient: recipientStr,
      sender,
      subject,
      status: "sent",
      sendbyteId,
      metadata,
    });

    return {
      success: true,
      id: sendbyteId,
      recipient: recipientStr,
    };
  } catch (err: any) {
    const errorMsg = err?.message || "Failed to communicate with SendByte API";
    await logEmailDelivery({
      recipient: recipientStr,
      sender,
      subject,
      status: "failed",
      errorMessage: errorMsg,
      errorDetails: { name: err?.name, stack: err?.stack },
      metadata,
    });

    return {
      success: false,
      error: errorMsg,
      recipient: recipientStr,
    };
  }
}

/**
 * Send multiple emails with controlled concurrency, detailed error isolation, and logging.
 * Identifies exactly which emails fail and why.
 */
export async function sendMultipleEmails(
  recipients: string[],
  options: {
    from?: string;
    subject: string;
    html?: string;
    text?: string;
    batchSize?: number;
    metadata?: Record<string, any>;
  },
): Promise<BulkSendResult> {
  const sender = options.from || getDefaultFromEmail();
  const failedDetails: EmailFailureDetail[] = [];
  const validEmails: string[] = [];
  const seen = new Set<string>();

  // 1. Validate every recipient and record invalid email formats
  for (const raw of recipients) {
    const cleaned = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!cleaned || !cleaned.includes("@")) {
      const detail: EmailFailureDetail = {
        email: raw || "(empty)",
        error: "Invalid email format (missing '@' or empty address)",
        timestamp: new Date().toISOString(),
      };
      failedDetails.push(detail);

      // Log immediately
      logEmailDelivery({
        recipient: detail.email,
        sender,
        subject: options.subject,
        status: "failed",
        errorMessage: detail.error,
        metadata: options.metadata,
      }).catch(() => {});
    } else if (!seen.has(cleaned)) {
      seen.add(cleaned);
      validEmails.push(cleaned);
    }
  }

  const batchSize = options.batchSize || 5;
  let sentCount = 0;

  // 2. Dispatch batches
  for (let i = 0; i < validEmails.length; i += batchSize) {
    const batch = validEmails.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (email) => {
        const result = await sendEmail({
          from: sender,
          to: email,
          subject: options.subject,
          html: options.html,
          text: options.text,
          metadata: options.metadata,
        });

        if (result.success) {
          sentCount++;
        } else {
          failedDetails.push({
            email,
            error: result.error || "Unknown SendByte error",
            statusCode: result.statusCode,
            timestamp: new Date().toISOString(),
          });
        }
      }),
    );
  }

  // 3. Log bulk summary
  if (failedDetails.length > 0) {
    console.error(
      `[SendByte BATCH COMPLETED WITH FAILURES] Total: ${recipients.length} | Sent: ${sentCount} | Failed: ${failedDetails.length}\n` +
        failedDetails.map((f) => `  ❌ ${f.email} -> ${f.error}`).join("\n"),
    );
  } else {
    console.log(
      `[SendByte BATCH COMPLETED SUCCESSFULLY] Total: ${recipients.length} | All ${sentCount} emails delivered.`,
    );
  }

  return {
    totalTargeted: recipients.length,
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
    metadata: { type: "welcome_email", recipientName },
  });
}
