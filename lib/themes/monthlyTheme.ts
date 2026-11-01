import type { SupabaseClient } from "@supabase/supabase-js";
import { MONTH_THEME } from "@/app/data/devotionalData";

export interface MonthlyTheme {
  monthKey: string;
  title: string;
  scripture: string | null;
  description: string | null;
}

/** The current month as 'YYYY-MM', in the app's time zone (Lagos). */
export function currentMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

/**
 * The theme for a month: the row for that month, or else the latest row before it.
 * Falls back to MONTH_THEME if the table is empty or unreachable.
 */
export async function getMonthlyTheme(
  supabase: SupabaseClient | null,
  monthKey: string,
): Promise<MonthlyTheme> {
  const fallback: MonthlyTheme = {
    monthKey,
    title: MONTH_THEME,
    scripture: null,
    description: null,
  };
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("monthly_themes")
      .select("month_key, title, scripture, description")
      .lte("month_key", monthKey)
      .order("month_key", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return fallback;
    return {
      monthKey: data.month_key,
      title: data.title,
      scripture: data.scripture,
      description: data.description,
    };
  } catch {
    return fallback;
  }
}
