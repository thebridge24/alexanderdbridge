import { NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEVOTIONALS_DATA, Devotional } from "@/app/data/devotionalData";

export async function GET() {
  const configError = assertSupabaseConfigured();
  const today = new Date();
  const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (configError) {
    const fallbackAnalytics = DEVOTIONALS_DATA
      .filter((d) => d.dateString <= todayDateString)
      .map((d) => ({
        dateString: d.dateString,
        topic: d.topic,
        dayNumber: d.dayNumber,
        displayDate: d.displayDate,
        views: 0,
        likes: 0,
        comments: 0,
      }));
    return NextResponse.json({
      analytics: fallbackAnalytics,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
    });
  }

  try {
    const supabase = createSupabaseAdmin();

    // 1. Fetch DB devotionals to combine with static ones
    const { data: dbDevotionals } = await supabase
      .from("devotionals")
      .select("*");

    const mappedDbDevotionals: Devotional[] = (dbDevotionals || []).map((row) => ({
      dayNumber: row.day_number,
      dateString: row.date_string,
      displayDate: row.display_date,
      topic: row.topic,
      text: row.text,
      memoryVerse: typeof row.memory_verse === "string" 
        ? JSON.parse(row.memory_verse) 
        : row.memory_verse,
      explanation: row.explanation,
      neededSteps: row.needed_steps,
      prayerPoints: row.prayer_points,
    }));

    const devotionalMap = new Map<string, Devotional>();
    DEVOTIONALS_DATA.forEach((d) => devotionalMap.set(d.dateString, d));
    mappedDbDevotionals.forEach((d) => devotionalMap.set(d.dateString, d));

    const combinedDevotionals = Array.from(devotionalMap.values())
      .filter((d) => d.dateString <= todayDateString)
      .sort((a, b) => {
        return a.dateString.localeCompare(b.dateString);
      });

    // 2. Fetch views, likes, and comments stats from Supabase
    const [viewsRes, likesRes, commentsRes] = await Promise.all([
      supabase.from("devotional_views").select("devotional_date, view_count"),
      supabase.from("devotional_likes").select("devotional_date, like_count"),
      supabase.from("devotional_comments").select("devotional_date"),
    ]);

    const viewsMap = new Map<string, number>();
    (viewsRes.data || []).forEach((row) => {
      viewsMap.set(row.devotional_date, Number(row.view_count || 0));
    });

    const likesMap = new Map<string, number>();
    (likesRes.data || []).forEach((row) => {
      likesMap.set(row.devotional_date, Number(row.like_count || 0));
    });

    const commentsMap = new Map<string, number>();
    (commentsRes.data || []).forEach((row) => {
      const current = commentsMap.get(row.devotional_date) || 0;
      commentsMap.set(row.devotional_date, current + 1);
    });

    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    const analytics = combinedDevotionals.map((d) => {
      const views = viewsMap.get(d.dateString) || 0;
      const likes = likesMap.get(d.dateString) || 0;
      const comments = commentsMap.get(d.dateString) || 0;

      totalViews += views;
      totalLikes += likes;
      totalComments += comments;

      return {
        dateString: d.dateString,
        topic: d.topic,
        dayNumber: d.dayNumber,
        displayDate: d.displayDate,
        views,
        likes,
        comments,
      };
    });

    return NextResponse.json({
      analytics,
      totalViews,
      totalLikes,
      totalComments,
    });
  } catch (err: any) {
    console.error("Error in GET /api/admin/analytics:", err);
    return NextResponse.json({ error: err.message || "Failed to load analytics" }, { status: 500 });
  }
}
