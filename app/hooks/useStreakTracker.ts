/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StreakData, MILESTONE_MEDALS, Medal } from "../../lib/types/streak";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

const MIN_DWELL_SECONDS = 300; // 5 minutes

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

  const startTimeRef = useRef<number>(Date.now());

  const getTodayString = useCallback(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  // 1. Resolve Active User ID from Props or Supabase Auth Session
  useEffect(() => {
    if (userIdProp) {
      setActiveUserId(userIdProp);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        setActiveUserId(data.session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setActiveUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [userIdProp]);

  // 2. Fetch Streaks Exclusively from Remote Database
  useEffect(() => {
    if (!activeUserId) return;
    const today = getTodayString();

    fetch(`/api/streaks?userId=${encodeURIComponent(activeUserId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((remote) => {
        if (remote && remote.found && remote.streakData) {
          const remoteData = remote.streakData as StreakData;
          setStreakData(remoteData);

          if (remoteData.attendanceHistory?.[today]?.completed) {
            setTodayCompleted(true);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load remote streak from database:", err);
      });
  }, [activeUserId, getTodayString]);

  // 3. Sync Completions Directly to Database
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

        await fetch("/api/streaks", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: uid,
            streakData: dataToSync,
          }),
        });
      } catch (err) {
        console.error("Failed to sync streak to database:", err);
      }
    },
    [],
  );

  // 4. Mark Today Complete
  const markTodayComplete = useCallback(() => {
    const today = getTodayString();

    setStreakData((prev) => {
      const attendance = {
        ...(prev.attendanceHistory || {}),
        [today]: {
          date: today,
          completed: true,
          durationSeconds: MIN_DWELL_SECONDS,
        },
      };

      // Current streak calculated as total completed length for precise value
      const totalCompletedCount = Object.values(attendance).filter(
        (item: any) => item?.completed
      ).length;

      const newStreak = Math.max(prev.currentStreak, totalCompletedCount);
      const newBest = Math.max(newStreak, prev.bestStreak);

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
        attendanceHistory: attendance,
      };

      if (activeUserId) {
        syncToDatabase(updatedData, activeUserId);
      }

      return updatedData;
    });

    setTodayCompleted(true);
    setDwellSeconds(MIN_DWELL_SECONDS);
  }, [activeUserId, getTodayString, syncToDatabase]);

  // 5. Robust Timestamp-Based Interval Tracker
  useEffect(() => {
    if (todayCompleted) return;

    startTimeRef.current = Date.now() - dwellSeconds * 1000;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 100,
      );

      if (elapsedSeconds >= MIN_DWELL_SECONDS) {
        setDwellSeconds(MIN_DWELL_SECONDS);
        markTodayComplete();
        clearInterval(interval);
      } else {
        setDwellSeconds(elapsedSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [todayCompleted, markTodayComplete]);

  const getNextMilestone = () => {
    const current = streakData.currentStreak;
    const targetMedal =
      MILESTONE_MEDALS.find((m) => m.targetDays > current) ||
      MILESTONE_MEDALS[MILESTONE_MEDALS.length - 1];
    return targetMedal ? targetMedal.targetDays : 7;
  };

  const currentMilestoneTarget = getNextMilestone();

  return {
    streakData,
    dwellSeconds,
    todayCompleted,
    newlyUnlockedMedal,
    currentMilestoneTarget,
    clearNewMedalAlert: () => setNewlyUnlockedMedal(null),
    minDwellSeconds: MIN_DWELL_SECONDS,
    markTodayComplete,
  };
}