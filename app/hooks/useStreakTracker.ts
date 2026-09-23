/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/set-state-in-effect */
// hooks/useStreakTracker.ts
"use client";

import { useState, useEffect } from "react";
import { StreakData, MILESTONE_MEDALS, Medal } from "../../lib/types/streak";

const STORAGE_KEY = "bridge_devotional_streak_v1";
const MIN_DWELL_SECONDS = 300; // 5 minutes

const getUserStorageKey = (userId?: string | null) =>
  userId ? `bridge_devotional_streak_user_${userId}` : STORAGE_KEY;

const mergeStreakData = (base: StreakData, incoming?: Partial<StreakData> | null): StreakData => {
  if (!incoming) {
    return base;
  }

  const attendanceHistory = {
    ...(base.attendanceHistory || {}),
    ...(incoming.attendanceHistory || {}),
  };

  const merged: StreakData = {
    currentStreak: Math.max(base.currentStreak || 0, incoming.currentStreak || 0),
    bestStreak: Math.max(base.bestStreak || 0, incoming.bestStreak || 0),
    lastVisitDate: incoming.lastVisitDate || base.lastVisitDate || "",
    unlockedMedalIds: Array.from(
      new Set([...(base.unlockedMedalIds || []), ...(incoming.unlockedMedalIds || [])]),
    ),
    attendanceHistory,
  };

  if (!merged.lastVisitDate && base.lastVisitDate) {
    merged.lastVisitDate = base.lastVisitDate;
  }

  return merged;
};

export function useStreakTracker(userId?: string | null) {
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mainKey = STORAGE_KEY;
    const userKey = getUserStorageKey(userId);

    try {
      const baseRaw = localStorage.getItem(mainKey);
      const userRaw = localStorage.getItem(userKey);
      const baseParsed = baseRaw ? (JSON.parse(baseRaw) as StreakData) : null;
      const userParsed = userRaw ? (JSON.parse(userRaw) as StreakData) : null;
      const merged = mergeStreakData(baseParsed || {
        currentStreak: 0,
        bestStreak: 0,
        lastVisitDate: "",
        unlockedMedalIds: [],
        attendanceHistory: {},
      }, userParsed);

      setStreakData(merged);

      const today = getTodayString();
      const todayRecord = merged.attendanceHistory[today];
      if (todayRecord && todayRecord.completed) {
        setTodayCompleted(true);
      } else {
        setTodayCompleted(false);
      }

      localStorage.setItem(userKey, JSON.stringify(merged));
      if (!userId) {
        localStorage.setItem(mainKey, JSON.stringify(merged));
      }
    } catch (err) {
      console.error("Failed to parse or sync streak storage", err);
    }
  }, [userId]);

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
  }, [todayCompleted, streakData, userId]);

  const markTodayComplete = () => {
    const today = getTodayString();

    setStreakData((prev) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      const hadYesterday = prev.attendanceHistory[yesterdayStr]?.completed;
      const newStreak = hadYesterday ? prev.currentStreak + 1 : 1;
      const newBest = Math.max(newStreak, prev.bestStreak);

      const newlyWon = MILESTONE_MEDALS.find(
        (m) => m.targetDays <= newStreak && !prev.unlockedMedalIds.includes(m.id),
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

      const userKey = getUserStorageKey(userId);
      localStorage.setItem(userKey, JSON.stringify(updatedData));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergeStreakData(
        JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {
          currentStreak: 0,
          bestStreak: 0,
          lastVisitDate: "",
          unlockedMedalIds: [],
          attendanceHistory: {},
        },
        updatedData,
      )));

      return updatedData;
    });

    setTodayCompleted(true);
  };

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
  };
}