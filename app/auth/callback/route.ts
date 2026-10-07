import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const targetUrl = new URL(next, origin);
  if (code) {
    targetUrl.searchParams.set("code", code);
  }

  return NextResponse.redirect(targetUrl.toString());
}
