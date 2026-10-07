import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications/sender";
import { formatCommentLikeMessage } from "@/lib/notifications/messages";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  const { id } = await context.params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
  }

  let body: { sessionId?: string; actorUserId?: string; actorName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
  }

  // Extract optional authenticated actor from bearer token
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  try {
    const supabase = createSupabaseAdmin();
    let actorId = body.actorUserId?.trim();
    let actorName = body.actorName?.trim() || "Someone";

    if (accessToken) {
      const { data: authUser } = await supabase.auth.getUser(accessToken);
      if (authUser?.user) {
        actorId = authUser.user.id;
        actorName =
          authUser.user.user_metadata?.full_name ||
          authUser.user.user_metadata?.name ||
          actorName;
      }
    }

    const { data, error } = await supabase.rpc("toggle_comment_like", {
      p_comment_id: id,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("RPC error in toggle_comment_like:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as { like_count?: number; liked?: boolean };

    // Notify the comment author when someone likes their comment
    if (result.liked) {
      const { data: commentRow } = await supabase
        .from("devotional_comments")
        .select("author_user_id, author_name, devotional_date")
        .eq("id", id)
        .maybeSingle();

      const authorUserId = commentRow?.author_user_id as string | undefined;
      const dateString = (commentRow?.devotional_date as string) || "";

      if (authorUserId && (!actorId || actorId !== authorUserId)) {
        // Fetch display date for nice formatting (e.g. "Fri, 3 Oct")
        let displayDate = dateString;
        if (dateString) {
          try {
            const d = new Date(`${dateString}T00:00:00`);
            displayDate = d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            });
          } catch {}
        }

        const notifPayload = formatCommentLikeMessage(
          actorName,
          displayDate,
          dateString,
          id,
          actorId,
        );

        await sendNotification({
          userId: authorUserId,
          type: "like",
          title: notifPayload.title,
          body: notifPayload.body,
          link: notifPayload.link,
          dedupeKey: notifPayload.dedupeKey,
          push: true,
        });
      }
    }

    return NextResponse.json({
      likeCount: result.like_count ?? 0,
      liked: result.liked ?? false,
    });
  } catch (err: any) {
    console.error("Exception in POST /api/comments/[id]/like:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}