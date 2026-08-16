/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
// hooks/useStreakTracker.ts
"use client";

import { useState, useEffect } from "react";
import { StreakData, MILESTONE_MEDALS, Medal } from "../../lib/types/streak"

const STORAGE_KEY = "bridge_devotional_streak_v1";
const MIN_DWELL_SECONDS = 300; // 5 minutes

export function useStreakTracker() {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastVisitDate: "",
    unlockedMedalIds: [],
    attendanceHistory: {},
  });

  const [dwellSeconds, setDwellSeconds] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [newlyUnlockedMedal, setNewlyUnlockedMedal] = useState<Medal | null>(null);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // 1. Load initial data from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();

    if (raw) {
      try {
        const parsed: StreakData = JSON.parse(raw);
        setStreakData(parsed);

        const todayRecord = parsed.attendanceHistory[today];
        if (todayRecord && todayRecord.completed) {
          setTodayCompleted(true);
        }
      } catch (err) {
        console.error("Failed to parse streak storage", err);
      }
    }
  }, []);

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
  }, [todayCompleted, streakData]);

  // 3. Mark current day as completed once 5 mins threshold is met
  const markTodayComplete = () => {
    const today = getTodayString();
    
    setStreakData((prev) => {
      // Calculate continuous streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      const hadYesterday = prev.attendanceHistory[yesterdayStr]?.completed;
      const newStreak = hadYesterday ? prev.currentStreak + 1 : 1;
      const newBest = Math.max(newStreak, prev.bestStreak);

      // Check for newly unlocked medals
      const newlyWon = MILESTONE_MEDALS.find(
        (m) => m.targetDays <= newStreak && !prev.unlockedMedalIds.includes(m.id)
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      return updatedData;
    });

    setTodayCompleted(true);
  };

  // Helper to determine active target milestone (e.g. 7, 14, 21...)
  const getNextMilestone = () => {
    const current = streakData.currentStreak;
    const targetMedal = MILESTONE_MEDALS.find((m) => m.targetDays > current) || MILESTONE_MEDALS[MILESTONE_MEDALS.length - 1];
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
  };
}