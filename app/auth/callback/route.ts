import { NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/utils/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow same-site relative paths so this can't be used as an open redirect
  const next =
    getSafeRedirectPath(
      searchParams.get("next") ?? searchParams.get("redirectto") ?? searchParams.get("redirectTo"),
    ) ?? "/";

  const targetUrl = new URL(next, origin);
  if (code) {
    targetUrl.searchParams.set("code", code);
  }

  return NextResponse.redirect(targetUrl.toString());
}
