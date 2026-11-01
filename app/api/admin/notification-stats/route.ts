import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

/** Today's date in the app's time zone (Lagos, UTC+1), as YYYY-MM-DD. */
function todayInLagos(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Notification volume: total ever sent and sent today. Only admins can read it.
export async function GET(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createSupabaseAdmin();
  const { data: authData } = await supabase.auth.getUser(authorization.slice("Bearer ".length));
  const userId = authData?.user?.id;
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  if (!userId || !adminIds.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const todayStart = new Date(`${todayInLagos()}T00:00:00+01:00`).toISOString();

  const [total, today] = await Promise.all([
    supabase.from("notification_events").select("*", { count: "exact", head: true }),
    supabase
      .from("notification_events")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
  ]);

  if (total.error || today.error) {
    return NextResponse.json(
      { error: total.error?.message || today.error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { allTime: total.count ?? 0, today: today.count ?? 0 },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
