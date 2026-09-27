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

  const name = body.name?.trim();
  const text = body.text?.trim();
  const avatarUrl = (body.avatarUrl || body.avatar)?.trim() || null;
  const authorUserId = body.authorUserId?.trim() || null;

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
    const supabase = createSupabaseAdmin();
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

    // Notify the parent comment author when someone replies.
    const { data: parentComment } = await supabase
      .from("devotional_comments")
      .select("author_user_id, author_name")
      .eq("id", id)
      .maybeSingle();

    const parentAuthorUserId = parentComment?.author_user_id as string | undefined;
    if (parentAuthorUserId && authorUserId && authorUserId !== parentAuthorUserId) {
      await sendNotification({
        userId: parentAuthorUserId,
        type: "reply",
        title: "Someone replied to your comment",
        body: `${name} replied to your comment.`,
        link: `/devotional`,
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