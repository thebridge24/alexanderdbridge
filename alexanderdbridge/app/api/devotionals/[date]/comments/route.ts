import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { isValidDevotionalDate } from "@/lib/utils/date";

type RouteContext = {
  params: Promise<{ date: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const configError = assertSupabaseConfigured();
  if (configError) {
    return configError;
  }

  const { date } = await context.params;
  if (!isValidDevotionalDate(date)) {
    return NextResponse.json({ error: "Invalid devotional date" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("devotional_comments")
    .select("id, devotional_date, author_name, body, created_at")
    .eq("devotional_date", date)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
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
