import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

const BUCKET = "profile-media";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Upload the signed-in user's banner image and save its URL on their account
export async function POST(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(
    authorization.slice("Bearer ".length),
  );
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = authData.user;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (3 MB max)" }, { status: 400 });
  }

  const path = `banners/${user.id}-${Date.now()}.jpg`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const bannerUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, banner_url: bannerUrl },
  });
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ bannerUrl });
}
