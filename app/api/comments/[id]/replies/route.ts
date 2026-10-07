import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications/sender";
import { formatCommentReplyMessage } from "@/lib/notifications/messages";

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

  let body: {
    name?: string;
    text?: string;
    avatarUrl?: string;
    avatar?: string;
    authorUserId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let name = body.name?.trim();
  const text = body.text?.trim();
  const avatarUrl = (body.avatarUrl || body.avatar)?.trim() || null;
  let authorUserId = body.authorUserId?.trim() || null;

  // Extract optional authenticated actor from bearer token
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;

  const supabase = createSupabaseAdmin();

  if (accessToken) {
    const { data: authUser } = await supabase.auth.getUser(accessToken);
    if (authUser?.user) {
      authorUserId = authUser.user.id;
      name =
        authUser.user.user_metadata?.full_name ||
        authUser.user.user_metadata?.name ||
        name;
    }
  }

  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required and must be 100 characters or fewer" },
      { status: 400 },
    );
  }

  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Reply is required and must be 2000 characters or fewer" },
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from("devotional_comment_replies")
      .insert({
        comment_id: id,
        author_name: name,
        author_avatar: avatarUrl,
        author_user_id: authorUserId,
        body: text,
      })
      .select("id, comment_id, author_name, author_avatar, author_user_id, body, created_at")
      .single();

    if (error) {
      console.error("Error inserting comment reply:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retrieve parent comment info and previous replies in the thread
    const [parentRes, previousRepliesRes] = await Promise.all([
      supabase
        .from("devotional_comments")
        .select("author_user_id, author_name, devotional_date")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("devotional_comment_replies")
        .select("author_user_id")
        .eq("comment_id", id)
        .neq("id", data.id),
    ]);

    const parentComment = parentRes.data;
    const parentAuthorUserId = parentComment?.author_user_id as string | undefined;
    const dateString = (parentComment?.devotional_date as string) || "";

    const recipientsToNotify = new Set<string>();

    // 1. Notify parent comment author
    if (parentAuthorUserId && (!authorUserId || authorUserId !== parentAuthorUserId)) {
      recipientsToNotify.add(parentAuthorUserId);
    }

    // 2. Notify thread participants (others who replied to this comment)
    if (previousRepliesRes.data) {
      previousRepliesRes.data.forEach((r) => {
        if (r.author_user_id && r.author_user_id !== authorUserId && r.author_user_id !== parentAuthorUserId) {
          recipientsToNotify.add(r.author_user_id);
        }
      });
    }

    // Send notifications to recipients
    for (const recipientId of recipientsToNotify) {
      const notif = formatCommentReplyMessage(name, text, dateString, id, data.id);
      await sendNotification({
        userId: recipientId,
        type: "reply",
        title: notif.title,
        body: notif.body,
        link: notif.link,
        dedupeKey: `reply:${data.id}:${recipientId}`,
        push: true,
      });
    }

    return NextResponse.json({ reply: data }, { status: 201 });
  } catch (err: any) {
    console.error("Exception in POST /api/comments/[id]/replies:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}