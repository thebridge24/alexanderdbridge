import { createSupabaseAdmin } from "@/lib/supabase/server";

type Supabase = ReturnType<typeof createSupabaseAdmin>;

/** Free listeners get this many plays of each devotional's audio. */
export const FREE_AUDIO_PLAYS = 3;

/** Plans that unlock unlimited audio. Reader is the lowest paid plan. */
const PAID_PLANS = ["reader", "supporter", "sponsor", "partner", "patron", "visionary"];

/** Whether the user has an active, unexpired paid plan. */
export async function hasPaidPlan(supabase: Supabase, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_subscriptions")
    .select("plan_type, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || data.status !== "active") return false;
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return false;
  return PAID_PLANS.includes(String(data.plan_type));
}

/** The signed-in user's id, or null. */
export async function getSignedInUserId(request: Request, supabase: Supabase): Promise<string | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const { data } = await supabase.auth.getUser(authorization.slice("Bearer ".length));
  return data?.user?.id ?? null;
}

/** Whether the user is listed in ADMIN_USER_IDS. */
export function isAdminUserId(userId: string): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map((id) => id.trim()).filter(Boolean);
  return adminIds.includes(userId);
}
