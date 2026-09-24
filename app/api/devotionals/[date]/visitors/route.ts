import { NextRequest, NextResponse } from 'next/server';
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
    .select('id, display_name, avatar_url, visited_at')
    .eq('devotional_date', date)
    .order('visited_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ visitors: [] });

  return NextResponse.json(
    { visitors: data ?? [] },
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
