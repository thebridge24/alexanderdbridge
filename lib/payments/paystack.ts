import crypto from "crypto";

const PAYSTACK_API_BASE = "https://api.paystack.co";

export interface InitializePaystackParams {
  email: string;
  amountInNgn: number;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface InitializePaystackResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

export interface VerifyPaystackResult {
  success: boolean;
  status?: "success" | "failed" | "abandoned" | string;
  amountInNgn?: number;
  customerEmail?: string;
  metadata?: Record<string, any>;
  reference?: string;
  channel?: string;
  paidAt?: string;
  error?: string;
}

export function getPaystackSecretKey(): string | null {
  return process.env.PAYSTACK_SECRET_KEY || null;
}

export function getPaystackPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || null;
}

/**
 * Initialize a transaction on Paystack.
 * Paystack expects amount in Kobo (1 NGN = 100 Kobo).
 */
export async function initializePaystackTransaction({
  email,
  amountInNgn,
  metadata = {},
  callbackUrl,
}: InitializePaystackParams): Promise<InitializePaystackResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      error: "PAYSTACK_SECRET_KEY is not configured on the server.",
    };
  }

  const amountInKobo = Math.round(amountInNgn * 100);

  try {
    const res = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        currency: "NGN",
        callback_url: callbackUrl,
        metadata,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.status) {
      const errorMsg =
        data?.message || `Paystack initialization failed (HTTP ${res.status})`;
      console.error("Paystack initialize error:", errorMsg);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (err: any) {
    console.error("Paystack initialization exception:", err);
    return {
      success: false,
      error: err?.message || "Failed to initialize payment with Paystack",
    };
  }
}

/**
 * Verify a completed transaction reference with Paystack.
 */
export async function verifyPaystackTransaction(
  reference: string,
): Promise<VerifyPaystackResult> {
  const secretKey = getPaystackSecretKey();
  if (!secretKey) {
    return {
      success: false,
      error: "PAYSTACK_SECRET_KEY is not configured on the server.",
    };
  }

  try {
    const res = await fetch(
      `${PAYSTACK_API_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.status) {
      return {
        success: false,
        error: data?.message || `Paystack verification failed (HTTP ${res.status})`,
      };
    }

    const txData = data.data;
    const isSuccess = txData.status === "success";

    return {
      success: isSuccess,
      status: txData.status,
      amountInNgn: (txData.amount || 0) / 100,
      customerEmail: txData.customer?.email,
      metadata: txData.metadata || {},
      reference: txData.reference,
      channel: txData.channel,
      paidAt: txData.paid_at,
    };
  } catch (err: any) {
    console.error("Paystack verify exception:", err);
    return {
      success: false,
      error: err?.message || "Failed to verify transaction with Paystack",
    };
  }
}

/**
 * Validates a Paystack webhook HMAC SHA512 signature.
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secretKey = getPaystackSecretKey();
  if (!secretKey || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}
