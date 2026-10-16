/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { StreakData, MILESTONE_MEDALS, Medal } from "../../lib/types/streak";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";
import { computeStreaks } from "../../lib/utils/streak";

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

  // True once the saved streak has been loaded (or confirmed absent). Nothing is synced before
  // this, otherwise the empty initial state could overwrite a real streak in the database.
  const [remoteLoaded, setRemoteLoaded] = useState(false);

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
    setRemoteLoaded(false);

    fetch(
      `/api/streaks?userId=${encodeURIComponent(activeUserId)}&today=${today}`,
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Streak load failed (${res.status})`);
        return res.json();
      })
      .then((remote) => {
        if (remote && remote.found && remote.streakData) {
          const remoteData = remote.streakData as StreakData;
          setStreakData(remoteData);

          if (remoteData.attendanceHistory?.[today]?.completed) {
            setTodayCompleted(true);
          }
        }
        setRemoteLoaded(true);
      })
      .catch((err) => {
        // Leave remoteLoaded false so we never save over a streak we failed to read
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
    if (activeUserId && !remoteLoaded) return;
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

      // Streaks are counted from the completed days, never stored as a number
      const counted = computeStreaks(attendance, [], today);
      const newStreak = counted.currentStreak;
      const newBest = counted.bestStreak;

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
  }, [activeUserId, remoteLoaded, getTodayString, syncToDatabase]);

  // 5. Robust Timestamp-Based Interval Tracker
  useEffect(() => {
    if (todayCompleted) return;
    if (activeUserId && !remoteLoaded) return;

    startTimeRef.current = Date.now() - dwellSeconds * 1000;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
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
  }, [todayCompleted, markTodayComplete, activeUserId, remoteLoaded]);

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