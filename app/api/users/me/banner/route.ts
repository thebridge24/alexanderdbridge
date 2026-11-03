
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { assertSupabaseConfigured } from "@/lib/api/responses";

const BUCKET = "profile-media";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// GET: Retrieve the signed-in user's saved banner
export async function GET(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(
    authorization.slice("Bearer ".length)
  );

  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bannerUrl = data.user.user_metadata?.banner_url || null;

  return NextResponse.json({
    success: true,
    bannerUrl,
  });
}

// POST: Upload banner and save URL to user metadata
export async function POST(request: NextRequest) {
  const configError = assertSupabaseConfigured();
  if (configError) return configError;

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: authData, error: authError } =
    await supabase.auth.getUser(
      authorization.slice("Bearer ".length)
    );

  if (authError || !authData?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = authData.user;

  // --------------------------------------
  // Validate uploaded image
  // --------------------------------------

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Choose an image to upload" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG or WebP image" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (3 MB max)" },
      { status: 400 }
    );
  }

  // --------------------------------------
  // Retrieve existing banner
  // --------------------------------------

  const oldBannerUrl = user.user_metadata?.banner_url || null;

  // --------------------------------------
  // Upload new banner
  // --------------------------------------

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const newPath = `banners/${user.id}-${Date.now()}.${extension}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const bannerUrl = supabase.storage
    .from(BUCKET)
    .getPublicUrl(newPath).data.publicUrl;

  // --------------------------------------
  // Update user metadata
  // --------------------------------------

  const { error: updateError } =
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        banner_url: bannerUrl,
      },
    });

  // If metadata update fails, remove the new upload
  if (updateError) {
    await supabase.storage
      .from(BUCKET)
      .remove([newPath]);

    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // --------------------------------------
  // Delete previous banner from storage
  // --------------------------------------

  let oldBannerDeleted = true;

  if (oldBannerUrl && oldBannerUrl !== bannerUrl) {
    try {
      const oldUrl = new URL(oldBannerUrl);

      const storagePrefix = `/storage/v1/object/public/${BUCKET}/`;

      if (oldUrl.pathname.includes(storagePrefix)) {
        const oldPath = decodeURIComponent(
          oldUrl.pathname.split(storagePrefix)[1]
        );

        // Only delete this user's own banner files
        const isOwnBanner = oldPath.startsWith(
          `banners/${user.id}-`
        );

        if (isOwnBanner && !oldPath.includes("..")) {
          const { error: deleteError } = await supabase.storage
            .from(BUCKET)
            .remove([oldPath]);

          if (deleteError) {
            oldBannerDeleted = false;
            console.error(
              "Old banner deletion failed:",
              deleteError.message
            );
          }
        }
      }
    } catch (error) {
      oldBannerDeleted = false;

      console.error(
        "Error cleaning up old banner:",
        error
      );
    }
  }

  // --------------------------------------
  // Return response
  // --------------------------------------

  return NextResponse.json({
    success: true,
    bannerUrl,
    oldBannerDeleted,
    message: oldBannerDeleted
      ? "Banner updated successfully."
      : "Banner updated, but the previous image could not be deleted.",
  });
}
