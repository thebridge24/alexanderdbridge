import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getPusherChannels, userChannelName } from "@/lib/pusher/server";

/** Authorizes a signed-in user to subscribe to their own private-user-<id> channel. */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const channels = getPusherChannels();
  if (!channels) {
    return NextResponse.json({ error: "Pusher is not configured" }, { status: 503 });
  }

  const params = new URLSearchParams(await request.text());
  const socketId = params.get("socket_id");
  const channelName = params.get("channel_name");

  if (!socketId || !channelName) {
    return NextResponse.json({ error: "socket_id and channel_name are required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  if (channelName !== userChannelName(userData.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(channels.authorizeChannel(socketId, channelName));
}
