import { Resend } from "resend";
import { getWelcomeEmailHtml, getWelcomeEmailText } from "./templates/welcome";

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendWelcomeEmail(
  toEmail: string,
  recipientName?: string,
  devotionalUrl?: string,
): Promise<SendEmailResult> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("Welcome email skipped: RESEND_API_KEY environment variable is not configured.");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    "Alexander D. Bridge <welcome@alexanderdbridge.com>";

  try {
    const html = getWelcomeEmailHtml(recipientName, devotionalUrl);
    const text = getWelcomeEmailText(recipientName, devotionalUrl);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: "Welcome to Bridge Daily Devotional ❤️",
      html,
      text,
    });

    if (error) {
      console.error("Resend error sending welcome email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error("Exception sending welcome email via Resend:", err);
    return { success: false, error: err.message || "Internal server error" };
  }
}
