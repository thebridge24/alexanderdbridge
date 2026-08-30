import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEVOTIONALS_DATA, Devotional } from "@/app/data/devotionalData";
import { isValidDevotionalDate } from "@/lib/utils/date";

export async function GET() {
  const configError = assertSupabaseConfigured();
  if (configError) {
    // If Supabase is not configured, fall back to static data cleanly
    return NextResponse.json({ devotionals: DEVOTIONALS_DATA });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: dbDevotionals, error } = await supabase
      .from("devotionals")
      .select("*");

    if (error) {
      console.error("Error fetching devotionals from DB:", error);
      // Fall back to static data in case of DB error to keep the app functional
      return NextResponse.json({ devotionals: DEVOTIONALS_DATA });
    }

    // Map DB devotionals to the camelCase Devotional interface
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

    // Merge static and dynamic devotionals, with database entries taking precedence
    const devotionalMap = new Map<string, Devotional>();
    
    // Add static devotionals
    DEVOTIONALS_DATA.forEach((d) => {
      devotionalMap.set(d.dateString, d);
    });

    // Overwrite/add database devotionals
    mappedDbDevotionals.forEach((d) => {
      devotionalMap.set(d.dateString, d);
    });

    // Convert back to array and sort chronologically by dateString
    const combinedDevotionals = Array.from(devotionalMap.values()).sort((a, b) => {
      return a.dateString.localeCompare(b.dateString);
    });

    return NextResponse.json({ devotionals: combinedDevotionals });
  } catch (err) {
    console.error("Error in GET /api/devotionals:", err);
    return NextResponse.json({ devotionals: DEVOTIONALS_DATA });
  }
}

export async function POST(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const {
    dateString,
    dayNumber,
    displayDate,
    topic,
    text,
    memoryVerse,
    explanation,
    neededSteps,
    prayerPoints,
  } = body;

  if (!dateString || !isValidDevotionalDate(dateString)) {
    return NextResponse.json({ error: "Valid dateString (YYYY-MM-DD) is required" }, { status: 400 });
  }

  const parsedDayNumber = parseInt(dayNumber, 10);
  if (isNaN(parsedDayNumber) || parsedDayNumber <= 0) {
    return NextResponse.json({ error: "Valid positive dayNumber is required" }, { status: 400 });
  }

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

  if (!Array.isArray(neededSteps) || neededSteps.some(s => typeof s !== "string")) {
    return NextResponse.json({ error: "neededSteps must be an array of strings" }, { status: 400 });
  }

  if (!Array.isArray(prayerPoints) || prayerPoints.some(s => typeof s !== "string")) {
    return NextResponse.json({ error: "prayerPoints must be an array of strings" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("devotionals")
      .upsert({
        date_string: dateString,
        day_number: parsedDayNumber,
        display_date: displayDate.trim(),
        topic: topic.trim(),
        text: text.trim(),
        memory_verse: memoryVerse,
        explanation: explanation.trim(),
        needed_steps: neededSteps.map(s => s.trim()).filter(Boolean),
        prayer_points: prayerPoints.map(s => s.trim()).filter(Boolean),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ devotional: data }, { status: 201 });
  } catch (err: any) {
    console.error("Exception in POST /api/devotionals:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
