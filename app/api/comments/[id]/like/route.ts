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

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: "Valid sessionId is required" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("toggle_comment_like", {
      p_comment_id: id,
      p_session_id: sessionId,
    });

    if (error) {
      console.error("RPC error in toggle_comment_like:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = data as { like_count?: number; liked?: boolean };

    return NextResponse.json({
      likeCount: result.like_count ?? 0,
      liked: result.liked ?? false,
    });
  } catch (err: any) {
    console.error("Exception in POST /api/comments/[id]/like:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
