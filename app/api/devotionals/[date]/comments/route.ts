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
    .select("id, devotional_date, author_name, author_avatar, author_user_id, body, created_at, like_count")
    .eq("devotional_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = rawComments ?? [];
  const commentIds = comments.map((c) => c.id);

  let likedSet = new Set<string>();
  const repliesMap = new Map<string, any[]>();

  if (commentIds.length > 0) {
    const [likedSessionsRes, repliesRes] = await Promise.all([
      sessionId
        ? supabase
            .from("devotional_comment_like_sessions")
            .select("comment_id")
            .eq("session_id", sessionId)
            .in("comment_id", commentIds)
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("devotional_comment_replies")
        .select("id, comment_id, author_name, author_avatar, author_user_id, body, created_at")
        .in("comment_id", commentIds)
        .order("created_at", { ascending: true }),
    ]);

    if (likedSessionsRes.data) {
      likedSet = new Set(likedSessionsRes.data.map((s) => s.comment_id));
    }

    if (repliesRes.data) {
      repliesRes.data.forEach((r) => {
        const currentList = repliesMap.get(r.comment_id) || [];
        currentList.push({
          id: r.id,
          author_name: r.author_name,
          author_avatar: r.author_avatar,
          author_user_id: r.author_user_id,
          body: r.body,
          created_at: r.created_at,
        });
        repliesMap.set(r.comment_id, currentList);
      });
    }
  }

  // Collect distinct author_user_ids across comments & replies
  const authorUserIds = Array.from(
    new Set(
      [
        ...comments.map((c) => c.author_user_id),
        ...Array.from(repliesMap.values()).flatMap((list) => list.map((r) => r.author_user_id)),
      ].filter(Boolean) as string[],
    ),
  );

  const verificationMap = new Map<string, string>();
  const streakMap = new Map<string, number>();
  const globalPositionMap = new Map<string, number>();

  if (authorUserIds.length > 0) {
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, verification_tier")
      .in("user_id", authorUserIds)
      .eq("status", "active");

    if (subs) {
      subs.forEach((s) => {
        if (s.user_id && s.verification_tier) {
          verificationMap.set(s.user_id, s.verification_tier);
        }
      });
    }
  }

  // Fetch ALL user streaks from database to compute exact completed length & rankings globally
  const { data: allStreaks } = await supabase
    .from("user_streaks")
    .select("user_id, streak_data, updated_at, created_at");

  if (allStreaks) {
    // Compute exact streak length from attendanceHistory items where completed === true
    const computedStreaks = allStreaks.map((row) => {
      let length = 0;
      const sData = row.streak_data as any;
      if (sData && sData.attendanceHistory) {
        length = Object.values(sData.attendanceHistory).filter(
          (entry: any) => entry && entry.completed === true
        ).length;
      }
      return {
        user_id: row.user_id,
        length,
        updated_at: row.updated_at,
        created_at: row.created_at,
      };
    });

    // Sort globally by highest completed length first, then tie-breakers
    computedStreaks.sort((a, b) => {
      if (b.length !== a.length) return b.length - a.length;
      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : Infinity;
      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : Infinity;
      if (timeA !== timeB) return timeA - timeB;
      const createdA = a.created_at ? new Date(a.created_at).getTime() : Infinity;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : Infinity;
      return createdA - createdB;
    });

    computedStreaks.forEach((item, index) => {
      if (item.user_id) {
        streakMap.set(item.user_id, item.length);
        globalPositionMap.set(item.user_id, index + 1); // 1st, 2nd, 3rd global rank
      }
    });
  }

  const formattedComments = comments.map((c) => {
    const userId = c.author_user_id;

    return {
      id: c.id,
      devotional_date: c.devotional_date,
      author_name: c.author_name,
      author_avatar: c.author_avatar,
      author_user_id: userId,
      author_verification_tier: userId ? verificationMap.get(userId) || null : null,
      streakCount: userId ? streakMap.get(userId) || 0 : 0,
      globalPosition: userId ? globalPositionMap.get(userId) : undefined,
      body: c.body,
      created_at: c.created_at,
      like_count: c.like_count ?? 0,
      liked: likedSet.has(c.id),
      replies: (repliesMap.get(c.id) || []).map((r) => {
        const replyUserId = r.author_user_id;
        return {
          id: r.id,
          author_name: r.author_name,
          author_avatar: r.author_avatar,
          author_user_id: replyUserId,
          author_verification_tier: replyUserId ? verificationMap.get(replyUserId) || null : null,
          streakCount: replyUserId ? streakMap.get(replyUserId) || 0 : 0,
          globalPosition: replyUserId ? globalPositionMap.get(replyUserId) : undefined,
          body: r.body,
          created_at: r.created_at,
        };
      }),
    };
  });

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
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  let body: { name?: string; text?: string; avatarUrl?: string; authorUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let name = body.name?.trim();
  const text = body.text?.trim();
  const avatarUrl = (body.avatarUrl || "").trim() || "";
  let authorUserId = body.authorUserId?.trim() || null;

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
      { error: "Comment is required and must be 2000 characters or fewer" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("devotional_comments")
    .insert({
      devotional_date: date,
      author_name: name,
      author_avatar: avatarUrl,
      author_user_id: authorUserId,
      body: text,
    })
    .select("id, devotional_date, author_name, author_avatar, author_user_id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}