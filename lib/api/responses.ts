import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export function serviceUnavailableResponse() {
  return NextResponse.json(
    { error: "Supabase is not configured on the server" },
    { status: 503 },
  );
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    return serviceUnavailableResponse();
  }

  return null;
}
