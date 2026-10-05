import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/resend";
import { getAuthRedirectUrl } from "@/lib/utils/auth";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    const user = userData.user;
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json({ error: "User does not have an email address" }, { status: 400 });
    }

    // Check if welcome email was already sent
    const { data: pref } = await supabase
      .from("notification_preferences")
      .select("welcome_email_sent_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pref?.welcome_email_sent_at) {
      return NextResponse.json({ alreadySent: true, sentAt: pref.welcome_email_sent_at });
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      userEmail.split("@")[0];

    const devotionalUrl = getAuthRedirectUrl("/devotional");

    const emailResult = await sendWelcomeEmail(userEmail, displayName, devotionalUrl);

    if (emailResult.success) {
      const nowIso = new Date().toISOString();
      await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            welcome_email_sent_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "user_id" },
        );

      return NextResponse.json({ success: true, sentAt: nowIso });
    } else {
      return NextResponse.json(
        { error: emailResult.error || "Failed to send welcome email" },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error("Welcome email route error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
