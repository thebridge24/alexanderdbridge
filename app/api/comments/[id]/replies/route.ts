import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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
      { status: 400 }
    );
  }

  if (!text || text.length > 2000) {
    return NextResponse.json(
      { error: "Reply is required and must be 2000 characters or fewer" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("devotional_comment_replies")
      .insert({
        comment_id: id,
        author_name: name,
        body: text,
      })
      .select("id, comment_id, author_name, body, created_at")
      .single();

    if (error) {
      console.error("Error inserting comment reply:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reply: data }, { status: 201 });
  } catch (err: any) {
    console.error("Exception in POST /api/comments/[id]/replies:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
