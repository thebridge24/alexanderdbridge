import type { SupabaseClient } from "@supabase/supabase-js";

export interface ComputedStreaks {
  currentStreak: number;
  bestStreak: number;
  /** Sorted YYYY-MM-DD dates the user completed a devotional. */
  completedDates: string[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function formatLocalDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Every date the user completed, from attendance history and the completed list combined. */
export function getCompletedDates(
  attendanceHistory?: Record<string, { completed?: boolean }> | null,
  completedDevotionals?: unknown,
): string[] {
  const dates = new Set<string>();
  if (attendanceHistory && typeof attendanceHistory === "object") {
    for (const [date, record] of Object.entries(attendanceHistory)) {
      if (record?.completed && DATE_RE.test(date)) dates.add(date);
    }
  }
  if (Array.isArray(completedDevotionals)) {
    for (const date of completedDevotionals) {
      if (typeof date === "string" && DATE_RE.test(date)) dates.add(date);
    }
  }
  return Array.from(dates).sort();
}

/**
 * Single source of truth for streaks. Nothing stores a streak number: it is always counted
 * from the completed days.
 * - bestStreak: longest run of consecutive completed days.
 * - currentStreak: the run that ends today or yesterday (today may still be unread);
 *   0 once a full day has been missed.
 */
export function computeStreaks(
  attendanceHistory?: Record<string, { completed?: boolean }> | null,
  completedDevotionals?: unknown,
  today: string = formatLocalDate(),
): ComputedStreaks {
  const completedDates = getCompletedDates(attendanceHistory, completedDevotionals);
  if (completedDates.length === 0) {
    return { currentStreak: 0, bestStreak: 0, completedDates };
  }

  const days = completedDates.map(toDayNumber);
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  // `run` is now the length of the run ending at the latest completed day
  const gap = toDayNumber(today) - days[days.length - 1];
  const currentStreak = gap <= 1 ? run : 0;

  return { currentStreak, bestStreak: best, completedDates };
}

/** Current streak for many users at once (comments, visitors, likes...). */
export async function getCurrentStreaks(
  supabase: SupabaseClient,
  userIds: string[],
  today?: string,
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return result;

  const { data } = await supabase
    .from("user_streaks")
    .select("user_id, attendance_history, completed_devotionals")
    .in("user_id", ids);

  for (const row of data ?? []) {
    result.set(
      row.user_id,
      computeStreaks(row.attendance_history, row.completed_devotionals, today).currentStreak,
    );
  }
  return result;
}
