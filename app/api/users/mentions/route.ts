import { NextRequest, NextResponse } from "next/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getSignedInUserId } from "@/lib/audio/access";

// Comment mention suggestions do not depend on the admin analytics or follow tables.
export async function GET(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;
  const supabase = createSupabaseAdmin();
  const viewerId = await getSignedInUserId(request, supabase);
  if (!viewerId) return NextResponse.json({ error: "Sign in to tag a member." }, { status: 401 });

  const users: { id: string; name: string; avatar_url: string; verification_tier: string | null }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: "Could not load members. Please reopen comments to retry." }, { status: 500 });
    for (const user of data.users) {
      if (user.id === viewerId) continue;
      const meta = user.user_metadata ?? {};
      users.push({
        id: user.id,
        name: meta.full_name || meta.name || user.email?.split("@")[0] || "Believer",
        avatar_url: meta.avatar_url || meta.picture || "",
        verification_tier: meta.verification_tier ?? null,
      });
    }
    if (data.users.length < 1000) break;
  }
  return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
}
