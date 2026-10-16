import { NextRequest, NextResponse } from 'next/server';
import { getCurrentStreaks } from '@/lib/utils/streak';
import { isSupabaseConfigured, createSupabaseAdmin } from '@/lib/supabase/server';
import { isValidDevotionalDate } from '@/lib/utils/date';

type RouteContext = { params: Promise<{ date: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) return NextResponse.json({ visitors: [] });

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('devotional_visitors')
    .select('id, user_id, display_name, avatar_url, visited_at')
    .eq('devotional_date', date)
    .order('visited_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ visitors: [] });

  const visitors = data ?? [];
  const userIds = visitors.map((v) => v.user_id).filter(Boolean);

  const subMap = new Map<string, string>();
  const streakMap = new Map<string, number>();

  if (userIds.length > 0) {
    // 1. Fetch verification tiers
    const { data: subs } = await supabase
      .from('user_subscriptions')
      .select('user_id, verification_tier')
      .in('user_id', userIds)
      .eq('status', 'active');

    if (subs) {
      subs.forEach((s) => {
        if (s.user_id && s.verification_tier) {
          subMap.set(s.user_id, s.verification_tier);
        }
      });
    }

    // 2. Fetch user streaks from your streak table (e.g. user_streaks / streaks)
    // Adjust table name if your schema uses something else (e.g., 'user_streaks')
    const streaks = await getCurrentStreaks(supabase, userIds);
    streaks.forEach((count, id) => streakMap.set(id, count));
  }

  const formattedVisitors = visitors.map((v) => ({
    id: v.id,
    user_id: v.user_id,
    display_name: v.display_name,
    avatar_url: v.avatar_url,
    visited_at: v.visited_at,
    verification_tier: v.user_id ? subMap.get(v.user_id) || null : null,
    streakCount: v.user_id ? streakMap.get(v.user_id) || 0 : 0,
  }));

  return NextResponse.json(
    { visitors: formattedVisitors },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: false });

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

  let body: { userId?: string; displayName?: string; avatarUrl?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  const supabase = createSupabaseAdmin();
  let userId = body.userId;

  if (accessToken) {
    const { data: userData } = await supabase.auth.getUser(accessToken);
    if (userData?.user?.id) {
      userId = userData.user.id;
      // Trust metadata from auth token over client-sent values  
      body.displayName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || body.displayName || '';
      body.avatarUrl = userData.user.user_metadata?.avatar_url || userData.user.user_metadata?.picture || body.avatarUrl || '';
    }
  }

  if (!userId) return NextResponse.json({ error: 'Auth required' }, { status: 401 });

  const { error } = await supabase
    .from('devotional_visitors')
    .upsert({
      devotional_date: date,
      user_id: userId,
      display_name: (body.displayName || '').slice(0, 80),
      avatar_url: (body.avatarUrl || '').slice(0, 500),
      visited_at: new Date().toISOString(),
    }, { onConflict: 'devotional_date,user_id' });

  if (error) {
    console.error('Error recording visitor:', error);
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
