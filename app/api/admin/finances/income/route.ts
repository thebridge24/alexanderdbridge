/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, category, narration, date, type } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Title and amount are required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase.from("financial_ledgers").insert([
      {
        title,
        amount: Number(amount) || 0,
        category: category || "General",
        narration: narration || "",
        date: date || new Date().toISOString().slice(0, 10),
        type: type || "income", // 'income' or 'expense'
      },
    ]).select();

    if (error) {
      console.error("Supabase insert error:", error);
      throw error;
    }

    return NextResponse.json({ success: true, record: data?.[0] });
  } catch (error: any) {
    console.error("Failed to save ledger record:", error);
    return NextResponse.json({ error: error?.message || "Failed to save record" }, { status: 500 });
  }
}