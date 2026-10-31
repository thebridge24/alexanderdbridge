import { createSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEVOTIONALS_DATA, Devotional } from "@/app/data/devotionalData";
import { MILESTONE_MEDALS } from "@/lib/types/streak";
import { getCurrentStreaks } from "@/lib/utils/streak";

export interface MonthlyWrappedData {
  user: {
    id: string;
    name: string;
    avatar?: string;
    joinedAt?: string;
  };
  period: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
    comingMonth: string;
    isLastDayOfMonth: boolean;
  };
  theme: {
    title: string;
    scripture: string;
    description: string;
  };
  devotionals: {
    id: string;
    date: string;
    dayNumber: number;
    title: string;
    excerpt: string;
    completed: boolean;
  }[];
  statistics: {
    totalPublished: number;
    completed: number;
    missed: number;
    completionRate: number;
    longestStreak: number;
    currentStreak: number;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    targetDays: number;
    earned: boolean;
  }[];
  highlights: {
    title: string;
    description: string;
  }[];
}

/**
 * Reads "YYYY-MM-DD" as a local calendar date. `new Date("2026-10-15")`
 * is parsed as UTC, which can land on the previous month in some time zones.
 */
function resolveTargetDate(input?: Date | string): Date {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(input);
}

export async function getMonthlyWrappedData(
  userId: string,
  targetDateInput?: Date | string
): Promise<MonthlyWrappedData> {
  const targetDate = resolveTargetDate(targetDateInput);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  // Dynamic month boundaries (handles leap years, 28/30/31 days)
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  const formattedMonth = String(month + 1).padStart(2, "0");
  const startDateStr = `${year}-${formattedMonth}-01`;
  const actualEndDay = Math.min(targetDate.getDate(), lastDayOfMonth.getDate());
  const endDateStr = `${year}-${formattedMonth}-${String(actualEndDay).padStart(2, "0")}`;

  const monthName = targetDate.toLocaleString("en-US", { month: "long" });
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const comingMonth = nextMonthDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const isLastDayOfMonth = targetDate.getDate() === lastDayOfMonth.getDate();

  const userProfile = { id: userId, name: "Believer", avatar: "", joinedAt: undefined as string | undefined };
  const supabase = isSupabaseConfigured() ? createSupabaseAdmin() : null;

  if (supabase) {
    try {
      const { data: userData } = await supabase
        .from("user_profiles")
        .select("display_name, full_name, avatar_url, created_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (userData) {
        userProfile.name = userData.full_name || userData.display_name || "Believer";
        userProfile.avatar = userData.avatar_url || "";
        userProfile.joinedAt = userData.created_at;
      }
    } catch { /* Fallback */ }
  }

  // Fetch devotionals for requested month
  let dbDevotionals: Devotional[] = [];
  if (supabase) {
    try {
      const { data } = await supabase
        .from("devotionals")
        .select("*")
        .gte("date_string", startDateStr)
        .lte("date_string", endDateStr);

      if (data) {
        dbDevotionals = data.map((row) => ({
          dayNumber: row.day_number,
          dateString: row.date_string,
          displayDate: row.display_date,
          topic: row.topic,
          text: row.text,
          memoryVerse: typeof row.memory_verse === "string" ? JSON.parse(row.memory_verse) : row.memory_verse,
          explanation: row.explanation,
          neededSteps: row.needed_steps,
          prayerPoints: row.prayer_points,
        }));
      }
    } catch { /* Fallback */ }
  }

  const devMap = new Map<string, Devotional>();
  DEVOTIONALS_DATA.forEach((d) => {
    if (d.dateString >= startDateStr && d.dateString <= endDateStr) devMap.set(d.dateString, d);
  });
  dbDevotionals.forEach((d) => devMap.set(d.dateString, d));

  const monthlyPublished = Array.from(devMap.values()).sort((a, b) =>
    a.dateString.localeCompare(b.dateString)
  );

  // Fetch verified user completion attendance history
  const completedDatesSet = new Set<string>();
  if (supabase && monthlyPublished.length > 0) {
    try {
      const { data: visitorData } = await supabase
        .from("devotional_visitors")
        .select("devotional_date")
        .eq("user_id", userId)
        .gte("devotional_date", startDateStr)
        .lte("devotional_date", endDateStr);

      if (visitorData) {
        visitorData.forEach((v) => completedDatesSet.add(v.devotional_date));
      }
    } catch { /* Fallback */ }
  }

  const devotionalsList = monthlyPublished.map((d) => ({
    id: d.dateString,
    date: d.dateString,
    dayNumber: d.dayNumber || parseInt(d.dateString.split("-")[2], 10),
    title: d.topic || "Daily Devotional",
    excerpt: d.explanation ? d.explanation.slice(0, 90) + "..." : "Daily devotional reading and spiritual reflection.",
    completed: completedDatesSet.has(d.dateString),
  }));

  const totalPublished = monthlyPublished.length;
  const completedCount = devotionalsList.filter((d) => d.completed).length;

  // Filter out days before user joined
  let eligiblePublished = totalPublished;
  if (userProfile.joinedAt) {
    const joinedStr = userProfile.joinedAt.slice(0, 10);
    if (joinedStr > startDateStr) {
      eligiblePublished = monthlyPublished.filter((d) => d.dateString >= joinedStr).length;
    }
  }

  const missedCount = Math.max(0, eligiblePublished - completedCount);
  const completionRate = eligiblePublished > 0 ? Math.round((completedCount / eligiblePublished) * 100) : 0;

  // Streaks
  let currentStreak = 0;
  let longestStreak = 0;
  if (supabase) {
    try {
      const streaks = await getCurrentStreaks(supabase, [userId]);
      currentStreak = streaks.get(userId) || 0;
    } catch { currentStreak = 0; }
  }

  let tempStreak = 0;
  devotionalsList.forEach((d) => {
    if (d.completed) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  const achievements = MILESTONE_MEDALS.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    targetDays: m.targetDays,
    earned: completedCount >= m.targetDays || longestStreak >= m.targetDays,
  }));

  const firstDevotional = monthlyPublished[0];
  const themeTitle = firstDevotional?.topic 
    ? `Walking in ${firstDevotional.topic.split(" ")[0]} & Grace`
    : `Growing in the Word`;

  const theme = {
    title: `${monthName} Theme: ${themeTitle}`,
    scripture: firstDevotional?.memoryVerse?.verse || "Psalm 119:105",
    description: `This month, we explored what it means to live by the Word and grow in our understanding of God.`,
  };

  const highlights = [];
  if (longestStreak >= 3) {
    highlights.push({
      title: `${longestStreak}-Day Streak Milestone`,
      description: `You maintained a continuous ${longestStreak}-day devotional streak during ${monthName}!`,
    });
  }
  if (completedCount > 0) {
    highlights.push({
      title: `Most Consistent Week`,
      description: `You showed great commitment with ${completedCount} completed sessions in ${monthName}.`,
    });
  } else {
    highlights.push({
      title: `A New Beginning Ahead`,
      description: `Every new month presents a fresh opportunity to anchor your daily life in God's Word.`,
    });
  }

  return {
    user: userProfile,
    period: {
      month: month + 1,
      year,
      monthName,
      startDate: startDateStr,
      endDate: endDateStr,
      comingMonth,
      isLastDayOfMonth,
    },
    theme,
    devotionals: devotionalsList,
    statistics: {
      totalPublished,
      completed: completedCount,
      missed: missedCount,
      completionRate,
      longestStreak,
      currentStreak,
    },
    achievements,
    highlights,
  };
}