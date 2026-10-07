export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/notifications/sender";
import {
  formatMorningReminderMessage,
  formatStreakSaverMessage,
  formatWinbackMessage,
} from "@/lib/notifications/messages";
import { DEVOTIONALS_DATA, Devotional } from "@/app/data/devotionalData";

/**
 * 5-minute Cron notification dispatcher.
 * Handles:
 * 1. Morning reminder at each user's custom reminder_time (default 05:00) in their local timezone.
 * 2. Evening streak-at-risk alert at 20:00 local time for users who haven't read today's devotional.
 * 3. Weekly win-back notification for inactive users.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const expected = `Bearer ${cronSecret}`;
    if (authorization !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createSupabaseAdmin();

    // 1. Load dynamic devotionals from DB or fallback
    const { data: dbDevotionals } = await supabase.from("devotionals").select("*");
    const devotionalMap = new Map<string, Devotional>();
    DEVOTIONALS_DATA.forEach((d) => devotionalMap.set(d.dateString, d));
    if (dbDevotionals) {
      dbDevotionals.forEach((row) => {
        devotionalMap.set(row.date_string, {
          dayNumber: row.day_number,
          dateString: row.date_string,
          displayDate: row.display_date,
          topic: row.topic,
          text: row.text,
          memoryVerse: typeof row.memory_verse === "string" ? JSON.parse(row.memory_verse) : row.memory_verse,
          explanation: row.explanation,
          neededSteps: row.needed_steps,
          prayerPoints: row.prayer_points,
        });
      });
    }

    // 2. Fetch users with preferences
    const { data: usersPrefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("*");

    if (prefsError || !usersPrefs) {
      console.error("Error fetching notification preferences:", prefsError);
      return NextResponse.json({ error: prefsError?.message || "Failed to load preferences" }, { status: 500 });
    }

    // 3. Fetch user streaks to check attendance
    const { data: userStreaksList } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_visit_date, attendance_history, completed_devotionals");

    const streaksMap = new Map<string, any>();
    if (userStreaksList) {
      userStreaksList.forEach((s) => streaksMap.set(s.user_id, s));
    }

    let remindersSent = 0;
    let streakAlertsSent = 0;
    let winbacksSent = 0;
    const pushFailures: { userId: string; error: string }[] = [];

    const nowUtc = new Date();

    for (const pref of usersPrefs) {
      const timezone = pref.timezone || "UTC";
      let localDateStr: string;
      let localHour: number;
      let localMinute: number;

      try {
        const dtf = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const parts = dtf.formatToParts(nowUtc);
        const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
        localDateStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
        localHour = parseInt(getPart("hour"), 10) || 0;
        localMinute = parseInt(getPart("minute"), 10) || 0;
      } catch {
        // Fallback to UTC if timezone string is invalid
        localDateStr = nowUtc.toISOString().slice(0, 10);
        localHour = nowUtc.getUTCHours();
        localMinute = nowUtc.getUTCMinutes();
      }

      const currentMinutesFromMidnight = localHour * 60 + localMinute;

      // Parse user's reminder time (e.g. "05:00:00")
      const [rHourStr, rMinStr] = (pref.reminder_time || "05:00:00").split(":");
      // Use isNaN rather than `||` so a midnight reminder (hour 0) isn't treated as missing
      const parsedHour = parseInt(rHourStr, 10);
      const parsedMinute = parseInt(rMinStr, 10);
      const reminderHour = Number.isNaN(parsedHour) ? 5 : parsedHour;
      const reminderMinute = Number.isNaN(parsedMinute) ? 0 : parsedMinute;
      const reminderMinutesFromMidnight = reminderHour * 60 + reminderMinute;

      const userStreak = streaksMap.get(pref.user_id);
      const isCompletedToday =
        userStreak?.attendance_history?.[localDateStr]?.completed === true ||
        (Array.isArray(userStreak?.completed_devotionals) &&
          userStreak.completed_devotionals.includes(localDateStr));

      // --- RULE 3: Morning Reminder ---
      // Due if current time is at or after reminder_time, within 3h catch-up window, and not sent today yet
      if (
        pref.reminder_enabled !== false &&
        pref.last_reminder_date !== localDateStr &&
        currentMinutesFromMidnight >= reminderMinutesFromMidnight &&
        currentMinutesFromMidnight <= reminderMinutesFromMidnight + 180
      ) {
        const devotional = devotionalMap.get(localDateStr) || Array.from(devotionalMap.values())[0];
        const topic = devotional?.topic || "Daily Devotional";
        const msg = formatMorningReminderMessage(topic, localDateStr, pref.user_id);

        const res = await sendNotification({
          userId: pref.user_id,
          type: "reminder",
          title: msg.title,
          body: msg.body,
          link: msg.link,
          dedupeKey: msg.dedupeKey,
          push: true,
        });

        if (res.pushError) {
          pushFailures.push({ userId: pref.user_id, error: res.pushError });
        }

        if (res.ok) {
          remindersSent += 1;
          await supabase
            .from("notification_preferences")
            .update({ last_reminder_date: localDateStr, updated_at: new Date().toISOString() })
            .eq("user_id", pref.user_id);
        }
      }

      // --- RULE 4: Evening Streak Saver Alert ---
      // Sent at 20:00 (8:00 PM) local time if user has an active streak (>= 1) and hasn't completed today
      if (
        pref.streak_enabled !== false &&
        pref.last_streak_nudge_date !== localDateStr &&
        localHour >= 20 &&
        localHour < 23 &&
        userStreak &&
        userStreak.current_streak >= 1 &&
        !isCompletedToday
      ) {
        const msg = formatStreakSaverMessage(userStreak.current_streak, localDateStr, pref.user_id);

        const res = await sendNotification({
          userId: pref.user_id,
          type: "streak",
          title: msg.title,
          body: msg.body,
          link: msg.link,
          dedupeKey: msg.dedupeKey,
          push: true,
        });

        if (res.pushError) {
          pushFailures.push({ userId: pref.user_id, error: res.pushError });
        }

        if (res.ok) {
          streakAlertsSent += 1;
          await supabase
            .from("notification_preferences")
            .update({ last_streak_nudge_date: localDateStr, updated_at: new Date().toISOString() })
            .eq("user_id", pref.user_id);
        }
      }

      // --- RULE 4b: Win-back for inactive users ---
      // For users with 0 streak who haven't completed in 3+ days; sent at their morning reminder time, max once every 7 days
      const daysSinceWinback = pref.last_winback_at
        ? (Date.now() - new Date(pref.last_winback_at).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (
        pref.streak_enabled !== false &&
        (!userStreak || userStreak.current_streak === 0) &&
        !isCompletedToday &&
        daysSinceWinback >= 7 &&
        currentMinutesFromMidnight >= reminderMinutesFromMidnight &&
        currentMinutesFromMidnight <= reminderMinutesFromMidnight + 180
      ) {
        const msg = formatWinbackMessage(localDateStr, pref.user_id);

        const res = await sendNotification({
          userId: pref.user_id,
          type: "streak",
          title: msg.title,
          body: msg.body,
          link: msg.link,
          dedupeKey: msg.dedupeKey,
          push: true,
        });

        if (res.pushError) {
          pushFailures.push({ userId: pref.user_id, error: res.pushError });
        }

        if (res.ok) {
          winbacksSent += 1;
          await supabase
            .from("notification_preferences")
            .update({ last_winback_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq("user_id", pref.user_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: usersPrefs.length,
      remindersSent,
      streakAlertsSent,
      winbacksSent,
      pushFailures,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Cron notification dispatcher failed:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
