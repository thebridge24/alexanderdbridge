import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getPusherBeams } from "@/lib/pusher/server";

/**
 * Beams TokenProvider endpoint. The Beams web SDK calls this with ?user_id=<id>
 * and we only issue a token if it matches the signed-in Supabase user.
 */
export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const beams = getPusherBeams();
  if (!beams) {
    return NextResponse.json({ error: "Pusher Beams is not configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  const requestedUserId = request.nextUrl.searchParams.get("user_id");
  if (requestedUserId !== userData.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(beams.generateToken(userData.user.id));
}
