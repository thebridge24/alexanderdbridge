// src/devotionalData.ts

export interface Devotional {
  dayNumber: number;
  dateString: string; // Format: YYYY-MM-DD for precise array matching
  displayDate: string;
  topic: string;
  text: string;
  memoryVerse: {
    verse: string;
    reference: string;
  };
  explanation: string;
  neededSteps: string[];
  prayerPoints: string[];
}

export const MONTH_THEME = "From Glory to Glory";

export const DEVOTIONALS_DATA: Devotional[] = [
 
];