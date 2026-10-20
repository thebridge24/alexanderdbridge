import { NextRequest, NextResponse, after } from "next/server";
import { getCurrentStreaks } from "@/lib/utils/streak";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isValidDevotionalDate } from "@/lib/utils/date";
import { DEVOTIONALS_DATA } from "@/app/data/devotionalData";
import { sendNotification } from "@/lib/notifications/sender";
import { formatDevotionalCommentMessage } from "@/lib/notifications/messages";

/** Every registered user id (paginated). */
async function getAllUserIds(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<Set<string>> {
  const ids = new Set<string>();
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) break;
    data.users.forEach((u) => ids.add(u.id));
    if (data.users.length < perPage) break;
  }
  return ids;
}

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

  // Look up verified subscriber status securely by user_id to prevent name spoofing
  const authorUserIds = Array.from(
    new Set(
      [
        ...comments.map((c) => c.author_user_id),
        ...Array.from(repliesMap.values()).flatMap((list) => list.map((r) => r.author_user_id)),
      ].filter(Boolean) as string[],
    ),
  );

  const verificationMap = new Map<string, string>();
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

  // Streaks are counted from each author's completed days
  const streakMap = await getCurrentStreaks(supabase, authorUserIds);

  const formattedComments = comments.map((c) => ({
    id: c.id,
    devotional_date: c.devotional_date,
    author_name: c.author_name,
    author_avatar: c.author_avatar,
    author_user_id: c.author_user_id,
    author_verification_tier: c.author_user_id ? verificationMap.get(c.author_user_id) || null : null,
    author_streak: c.author_user_id ? streakMap.get(c.author_user_id) || 0 : 0,
    body: c.body,
    created_at: c.created_at,
    like_count: c.like_count ?? 0,
    liked: likedSet.has(c.id),
    replies: (repliesMap.get(c.id) || []).map((r) => ({
      id: r.id,
      author_name: r.author_name,
      author_avatar: r.author_avatar,
      author_user_id: r.author_user_id,
      author_verification_tier: r.author_user_id ? verificationMap.get(r.author_user_id) || null : null,
      author_streak: r.author_user_id ? streakMap.get(r.author_user_id) || 0 : 0,
      body: r.body,
      created_at: r.created_at,
    })),
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

  let body: { name?: string; text?: string; avatarUrl?: string; authorUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let name = body.name?.trim();
  const text = body.text?.trim();
  let avatarUrl = (body.avatarUrl || "").trim() || "";
  let authorUserId = body.authorUserId?.trim() || null;

  // Extract authenticated user if available
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
      avatarUrl =
        authUser.user.user_metadata?.avatar_url ||
        authUser.user.user_metadata?.picture ||
        avatarUrl;
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

  // Find devotional topic
  let topic = "Daily Devotional";
  const staticDevotional = DEVOTIONALS_DATA.find((d) => d.dateString === date);
  if (staticDevotional?.topic) {
    topic = staticDevotional.topic;
  } else {
    const { data: dbDevo } = await supabase
      .from("devotionals")
      .select("topic")
      .eq("date_string", date)
      .maybeSingle();
    if (dbDevo?.topic) topic = dbDevo.topic;
  }

  // Notify everyone that someone commented. Runs after the response is sent so posting stays fast.
  const notif = formatDevotionalCommentMessage(name, topic, date, data.id, avatarUrl);
  const commentId = data.id as string;
  after(async () => {
    try {
      const recipientIds = await getAllUserIds(supabase);
      // Make sure configured admins are included even if they have no auth listing
      (process.env.ADMIN_USER_IDS || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .forEach((id) => recipientIds.add(id));
      if (authorUserId) recipientIds.delete(authorUserId);

      const ids = Array.from(recipientIds);
      const BATCH_SIZE = 10;
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        await Promise.all(
          ids.slice(i, i + BATCH_SIZE).map((userId) =>
            sendNotification({
              userId,
              type: "comment",
              title: notif.title,
              body: notif.body,
              link: notif.link,
              dedupeKey: `comment-all:${commentId}:${userId}`,
              avatarUrl: notif.avatarUrl,
              push: true,
            }),
          ),
        );
      }
    } catch (err) {
      console.error("Failed to notify users about new comment:", err);
    }
  });

  return NextResponse.json({ comment: data }, { status: 201 });
}