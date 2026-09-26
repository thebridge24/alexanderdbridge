import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isValidDevotionalDate } from "@/lib/utils/date";

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("devotionals")
      .select("*")
      .eq("date_string", date)
      .maybeSingle();

    if (error) {
      console.error("Error fetching devotional:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
    }

    return NextResponse.json({
      devotional: {
        dayNumber: data.day_number,
        dateString: data.date_string,
        displayDate: data.display_date,
        topic: data.topic,
        text: data.text,
        memoryVerse:
          typeof data.memory_verse === "string"
            ? JSON.parse(data.memory_verse)
            : data.memory_verse,
        explanation: data.explanation,
        neededSteps: data.needed_steps,
        prayerPoints: data.prayer_points,
      },
    });
  } catch (err: any) {
    console.error("Exception in GET /api/devotionals/[date]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    dayNumber,
    displayDate,
    topic,
    text,
    memoryVerse,
    explanation,
    neededSteps,
    prayerPoints,
  } = body;

  if (!displayDate || typeof displayDate !== "string" || !displayDate.trim()) {
    return NextResponse.json({ error: "displayDate is required" }, { status: 400 });
  }
  if (!topic || typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "text (Scripture reference) is required" }, { status: 400 });
  }
  if (
    !memoryVerse ||
    typeof memoryVerse !== "object" ||
    !memoryVerse.verse ||
    !memoryVerse.reference
  ) {
    return NextResponse.json({ error: "memoryVerse with verse and reference is required" }, { status: 400 });
  }
  if (!explanation || typeof explanation !== "string" || !explanation.trim()) {
    return NextResponse.json({ error: "explanation is required" }, { status: 400 });
  }
  if (!Array.isArray(neededSteps) || neededSteps.some((s: any) => typeof s !== "string")) {
    return NextResponse.json({ error: "neededSteps must be an array of strings" }, { status: 400 });
  }
  if (!Array.isArray(prayerPoints) || prayerPoints.some((s: any) => typeof s !== "string")) {
    return NextResponse.json({ error: "prayerPoints must be an array of strings" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const parsedDayNumber = parseInt(dayNumber, 10);
    const { data, error } = await supabase
      .from("devotionals")
      .update({
        date_string: date,
        day_number: isNaN(parsedDayNumber) ? undefined : parsedDayNumber,
        display_date: displayDate.trim(),
        topic: topic.trim(),
        text: text.trim(),
        memory_verse: memoryVerse,
        explanation: explanation.trim(),
        needed_steps: neededSteps.map((s: string) => s.trim()).filter(Boolean),
        prayer_points: prayerPoints.map((s: string) => s.trim()).filter(Boolean),
      })
      .eq("date_string", date)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ devotional: data });
  } catch (err: any) {
    console.error("Exception in PUT /api/devotionals/[date]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();

    // Remove dependent engagement rows first so the delete is clean
    await supabase.from("devotional_visitors").delete().eq("devotional_date", date);
    await supabase.from("devotional_comments").delete().eq("devotional_date", date);

    const { data, error } = await supabase
      .from("devotionals")
      .delete()
      .eq("date_string", date)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: date });
  } catch (err: any) {
    console.error("Exception in DELETE /api/devotionals/[date]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}