/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, amount, category, narration, date } = body;

    if (!title || !amount) {
      return NextResponse.json(
        { error: "Expense title and amount are required." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();

    const { data, error } = await supabase
      .from("financial_ledgers")
      .insert([
        {
          title,
          amount: Math.abs(Number(amount)) || 0,
          category: category || "Operations",
          type: "expense",
          narration: narration || "",
          date: date || new Date().toISOString().slice(0, 10),
        },
      ])
      .select();

    if (error) {
      console.error("Error creating expense entry:", error);
      throw error;
    }

    return NextResponse.json({ success: true, record: data?.[0] });
  } catch (error: any) {
    console.error("Failed to record expense:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record expense" },
      { status: 500 }
    );
  }
}