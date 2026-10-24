
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  VERIFICATION_TIERS,
  type VerificationTier,
} from "@/lib/utils/verification";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length);
    const supabase = createSupabaseAdmin();

    // Identify the authenticated user from their access token.
    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Read the user's existing subscription record.
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("verification_tier, status, expires_at")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (error) {
      console.error("Verification lookup failed:", error);
      return NextResponse.json(
        { error: "Failed to load verification" },
        { status: 500 }
      );
    }

    const tierValue = subscription?.verification_tier;
    const validTier =
      typeof tierValue === "string" &&
      Object.prototype.hasOwnProperty.call(
        VERIFICATION_TIERS,
        tierValue
      );

    const expired =
      Boolean(subscription?.expires_at) &&
      new Date(subscription!.expires_at!).getTime() <= Date.now();

    const tier: VerificationTier | null =
      subscription?.status === "active" &&
      !expired &&
      validTier
        ? (tierValue as VerificationTier)
        : null;

    return NextResponse.json(
      { verification_tier: tier },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Verification API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
