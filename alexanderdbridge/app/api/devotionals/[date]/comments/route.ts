import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isValidDevotionalDate } from "@/lib/utils/date";

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();
  const supabase = createSupabaseAdmin();
  
  const { data: rawComments, error } = await supabase
    .from("devotional_comments")
    .select("id, devotional_date, author_name, body, created_at, like_count")
    .eq("devotional_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = rawComments ?? [];
  const commentIds = comments.map((c) => c.id);

  let likedSet = new Set<string>();
  if (sessionId && commentIds.length > 0) {
    const { data: likedSessions } = await supabase
      .from("devotional_comment_like_sessions")
      .select("comment_id")
      .eq("session_id", sessionId)
      .in("comment_id", commentIds);

    if (likedSessions) {
      likedSet = new Set(likedSessions.map((s) => s.comment_id));
    }
  }

  const formattedComments = comments.map((c) => ({
    id: c.id,
    devotional_date: c.devotional_date,
    author_name: c.author_name,
    body: c.body,
    created_at: c.created_at,
    like_count: c.like_count ?? 0,
    liked: likedSet.has(c.id),
  }));

  return NextResponse.json(
    { comments: formattedComments },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  let body: { name?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const text = body.text?.trim();

  if (!name || name.length > 100) {
    return NextResponse.json(
      { error: "Name is required and must be 100 characters or fewer" },
      { status: 400 },
    );
  }

  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Comment is required and must be 2000 characters or fewer" },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("devotional_comments")
    .insert({
      devotional_date: date,
      author_name: name,
      body: text,
    })
    .select("id, devotional_date, author_name, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
