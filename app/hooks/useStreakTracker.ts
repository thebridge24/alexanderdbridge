/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
// hooks/useStreakTracker.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StreakData, MILESTONE_MEDALS, Medal } from "../../lib/types/streak";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

const STORAGE_KEY = "bridge_devotional_streak_v1";
const MIN_DWELL_SECONDS = 300; // 5 minutes

const getUserStorageKey = (uid?: string | null) =>
  uid ? `bridge_devotional_streak_user_${uid}` : STORAGE_KEY;

export function mergeStreakData(
  base: StreakData,
  incoming?: Partial<StreakData> | null,
): StreakData {
  if (!incoming) {
    return base;
  }

  const attendanceHistory = {
    ...(base.attendanceHistory || {}),
    ...(incoming.attendanceHistory || {}),
  };

  const currentStreak = Math.max(
    base.currentStreak || 0,
    incoming.currentStreak || 0,
  );
  const bestStreak = Math.max(
    base.bestStreak || 0,
    incoming.bestStreak || 0,
    currentStreak,
  );
  const unlockedMedalIds = Array.from(
    new Set([
      ...(base.unlockedMedalIds || []),
      ...(incoming.unlockedMedalIds || []),
    ]),
  );

  return {
    currentStreak,
    bestStreak,
    lastVisitDate: incoming.lastVisitDate || base.lastVisitDate || "",
    unlockedMedalIds,
    attendanceHistory,
  };
}

export function useStreakTracker(userIdProp?: string | null) {
  const [activeUserId, setActiveUserId] = useState<string | null>(
    userIdProp ?? null,
  );
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastVisitDate: "",
    unlockedMedalIds: [],
    attendanceHistory: {},
  });

  const [dwellSeconds, setDwellSeconds] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [newlyUnlockedMedal, setNewlyUnlockedMedal] = useState<Medal | null>(
    null,
  );

  const streakDataRef = useRef(streakData);
  streakDataRef.current = streakData;

  const getTodayString = useCallback(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  // Detect Supabase user if userIdProp is omitted
  useEffect(() => {
    if (userIdProp) {
      setActiveUserId(userIdProp);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setActiveUserId(data.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setActiveUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [userIdProp]);

  // Sync to database
  const syncToDatabase = useCallback(
    async (dataToSync: StreakData, uid: string) => {
      try {
        const supabase = createSupabaseBrowserClient();
        const session = (await supabase?.auth.getSession())?.data?.session;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const completedDevotionals = JSON.parse(
          localStorage.getItem("completed_devotionals") || "[]",
        );

        await fetch("/api/streaks", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: uid,
            streakData: dataToSync,
            completedDevotionals,
          }),
        });
      } catch (err) {
        console.error("Failed to sync streak to database:", err);
      }
    },
    [],
  );

  // 1. Load initial data from LocalStorage & sync with Supabase database
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mainKey = STORAGE_KEY;
    const userKey = getUserStorageKey(activeUserId);
    const today = getTodayString();

    try {
      const baseRaw = localStorage.getItem(mainKey);
      const userRaw = localStorage.getItem(userKey);
      const baseParsed = baseRaw ? (JSON.parse(baseRaw) as StreakData) : null;
      const userParsed = userRaw ? (JSON.parse(userRaw) as StreakData) : null;

      const initialEmpty: StreakData = {
        currentStreak: 0,
        bestStreak: 0,
        lastVisitDate: "",
        unlockedMedalIds: [],
        attendanceHistory: {},
      };

      const localMerged = mergeStreakData(
        baseParsed || initialEmpty,
        userParsed,
      );
      setStreakData(localMerged);

      const todayRecord = localMerged.attendanceHistory[today];
      if (todayRecord && todayRecord.completed) {
        setTodayCompleted(true);
      } else {
        setTodayCompleted(false);
      }

      // If active user is signed in, fetch remote database streak and reconcile
      if (activeUserId) {
        fetch(`/api/streaks?userId=${encodeURIComponent(activeUserId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((remote) => {
            if (remote && remote.found && remote.streakData) {
              const fullMerged = mergeStreakData(
                localMerged,
                remote.streakData,
              );
              setStreakData(fullMerged);

              if (fullMerged.attendanceHistory[today]?.completed) {
                setTodayCompleted(true);
              }

              // Update user localStorage
              localStorage.setItem(userKey, JSON.stringify(fullMerged));
              localStorage.setItem(mainKey, JSON.stringify(fullMerged));

              // Sync completed devotionals list
              if (Array.isArray(remote.completedDevotionals)) {
                const localCompleted = JSON.parse(
                  localStorage.getItem("completed_devotionals") || "[]",
                );
                const mergedCompleted = Array.from(
                  new Set([...localCompleted, ...remote.completedDevotionals]),
                );
                localStorage.setItem(
                  "completed_devotionals",
                  JSON.stringify(mergedCompleted),
                );
              }

              // If local had progress not yet in the DB, push update
              const isAhead =
                fullMerged.currentStreak > (remote.streakData.currentStreak || 0) ||
                Object.keys(fullMerged.attendanceHistory).length >
                  Object.keys(remote.streakData.attendanceHistory || {}).length;

              if (isAhead) {
                syncToDatabase(fullMerged, activeUserId);
              }
            } else if (localMerged.currentStreak > 0) {
              // Remote has no data yet, push local streak to DB
              syncToDatabase(localMerged, activeUserId);
            }
          })
          .catch((err) => {
            console.error("Error loading remote streak:", err);
          });
      }
    } catch (err) {
      console.error("Failed to parse streak storage", err);
    }
  }, [activeUserId, getTodayString, syncToDatabase]);

  // Mark current day as completed once 5 mins threshold is met or triggered by banner
  const markTodayComplete = useCallback(() => {
    const today = getTodayString();

    setStreakData((prev) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      const hadYesterday = prev.attendanceHistory[yesterdayStr]?.completed;
      const newStreak = hadYesterday ? prev.currentStreak + 1 : 1;
      const newBest = Math.max(newStreak, prev.bestStreak);

      // Check for newly unlocked medals
      const newlyWon = MILESTONE_MEDALS.find(
        (m) =>
          m.targetDays <= newStreak && !prev.unlockedMedalIds.includes(m.id),
      );

      const updatedUnlocked = [...prev.unlockedMedalIds];
      if (newlyWon && !updatedUnlocked.includes(newlyWon.id)) {
        updatedUnlocked.push(newlyWon.id);
        setNewlyUnlockedMedal(newlyWon);
      }

      const updatedData: StreakData = {
        currentStreak: newStreak,
        bestStreak: newBest,
        lastVisitDate: today,
        unlockedMedalIds: updatedUnlocked,
        attendanceHistory: {
          ...prev.attendanceHistory,
          [today]: {
            date: today,
            completed: true,
            durationSeconds: MIN_DWELL_SECONDS,
          },
        },
      };

      // Store in localStorage
      const userKey = getUserStorageKey(activeUserId);
      localStorage.setItem(userKey, JSON.stringify(updatedData));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));

      // Also record in completed_devotionals list for missed-yesterday banner
      try {
        const completedList = JSON.parse(
          localStorage.getItem("completed_devotionals") || "[]",
        );
        if (!completedList.includes(today)) {
          completedList.push(today);
          localStorage.setItem(
            "completed_devotionals",
            JSON.stringify(completedList),
          );
        }
      } catch {}

      // Sync to database if user is logged in
      if (activeUserId) {
        syncToDatabase(updatedData, activeUserId);
      }

      return updatedData;
    });

    setTodayCompleted(true);
  }, [activeUserId, getTodayString, syncToDatabase]);

  // 2. Track 5-Minute Timer Active Dwell Time
  useEffect(() => {
    if (todayCompleted) return;

    const interval = setInterval(() => {
      setDwellSeconds((prev) => {
        const updated = prev + 1;
        if (updated >= MIN_DWELL_SECONDS) {
          markTodayComplete();
          clearInterval(interval);
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [todayCompleted, markTodayComplete]);

  // Helper to determine active target milestone (e.g. 7, 14, 21...)
  const getNextMilestone = () => {
    const current = streakData.currentStreak;
    const targetMedal =
      MILESTONE_MEDALS.find((m) => m.targetDays > current) ||
      MILESTONE_MEDALS[MILESTONE_MEDALS.length - 1];
    return targetMedal.targetDays;
  };

  const currentMilestoneTarget = getNextMilestone();

  return {
    streakData,
    dwellSeconds,
    todayCompleted,
    currentMilestoneTarget,
    newlyUnlockedMedal,
    clearNewMedalAlert: () => setNewlyUnlockedMedal(null),
    minDwellSeconds: MIN_DWELL_SECONDS,
    markTodayComplete,
  };
}