import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications/sender";

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

  let body: { sessionId?: string; actorUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("toggle_comment_like", {
      p_comment_id: id,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("RPC error in toggle_comment_like:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as { like_count?: number; liked?: boolean };

    // Notify the comment author (if authenticated) when someone likes their comment.
    if (result.liked) {
      const { data: commentRow } = await supabase
        .from("devotional_comments")
        .select("author_user_id, author_name")
        .eq("id", id)
        .maybeSingle();

      const authorUserId = commentRow?.author_user_id as string | undefined;
      const actorId = body.actorUserId?.trim();

      if (authorUserId && actorId && actorId !== authorUserId) {
        await sendNotification({
          userId: authorUserId,
          type: "like",
          title: "Someone liked your comment",
          body: `Your comment${commentRow?.author_name ? ` by ${commentRow.author_name}` : ""} received a like.`,
          link: `/devotional`,
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