// types/streak.ts
import { IconType } from "react-icons";
import {
  FaFire,
  FaAnchor,
  FaBolt,
  FaCrown,
  FaShieldHalved,
  FaTrophy,
  FaGem,
  FaStar,
} from "react-icons/fa6";
import { GiCrossedSwords, GiCandleFlame, GiGalaxy } from "react-icons/gi";

export interface Medal {
  id: string;
  targetDays: number;
  name: string;
  icon: IconType; // React Icon Component
  description: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  completed: boolean; // True if stayed >= 5 mins
  durationSeconds: number;
}

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastVisitDate: string; // YYYY-MM-DD
  unlockedMedalIds: string[];
  attendanceHistory: Record<string, AttendanceRecord>; // key: YYYY-MM-DD
}

export const MILESTONE_MEDALS: Medal[] = [
  {
    id: "streak_7",
    targetDays: 7,
    name: "God Seeker",
    icon: FaFire,
    description: "Completed 7 Days of Devotional",
  },
  {
    id: "streak_14",
    targetDays: 14,
    name: "Word Seeker",
    icon: FaAnchor,
    description: "Completed 14 Days of Devotional",
  },
  {
    id: "streak_21",
    targetDays: 21,
    name: "Faith Builder",
    icon: FaBolt,
    description: "Completed 21 Days of Devotional",
  },
  {
    id: "streak_30",
    targetDays: 30,
    name: "Word Dweller",
    icon: GiCrossedSwords,
    description: "Completed 30 Days of Devotional",
  },
  {
    id: "streak_40",
    targetDays: 40,
    name: "Faithful One",
    icon: FaCrown,
    description: "Completed 40 Days of Devotional",
  },
  {
    id: "streak_60",
    targetDays: 60,
    name: "Light Bearer",
    icon: GiCandleFlame,
    description: "Completed 60 Days of Devotional",
  },
  {
    id: "streak_90",
    targetDays: 90,
    name: "Kingdom Builder",
    icon: FaShieldHalved,
    description: "Completed 90 Days of Devotional",
  },
  {
    id: "streak_120",
    targetDays: 120,
    name: "Overcomer",
    icon: FaTrophy,
    description: "Completed 120 Days of Devotional",
  },
  {
    id: "streak_200",
    targetDays: 200,
    name: "Faithful Disciple",
    icon: FaGem,
    description: "Completed 200 Days of Devotional",
  },
  {
    id: "streak_250",
    targetDays: 250,
    name: "Kingdom Light",
    icon: FaStar,
    description: "Completed 250 Days of Devotional",
  },
  {
    id: "streak_365",
    targetDays: 365,
    name: "Christlike",
    icon: GiGalaxy,
    description: "Completed 365 Days of Devotional",
  },
];