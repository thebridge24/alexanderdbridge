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

export const MONTH_THEME = "The Month of Supernatural Impact";

export const DEVOTIONALS_DATA: Devotional[] = [
  {
    dayNumber: 173,
    dateString: "2026-06-28",
    displayDate: "June 28, 2026",
    topic: "Let Your Generation Feel Your Impact",
    text: "Acts 13:36",
    memoryVerse: {
      verse: "“For David, after he had served his own generation by the will of God, fell on sleep.”",
      reference: "Acts 13:36, KJV"
    },
    explanation: "David did not merely exist. He served his generation. One day people should be able to point to problems that were solved because you lived. God did not bring you into this world to consume resources and occupy space. He brought you here to contribute something meaningful. Whether through your profession, leadership, business, ministry, creativity, or service, your generation should feel the weight of your contribution.",
    neededSteps: [
      "Identify how you can serve others.",
      "Develop skills that create impact.",
      "Live with purpose every day."
    ],
    prayerPoints: [
      "Lord, help me serve my generation well.",
      "Make my life count for something meaningful."
    ]
  }
  // Add subsequent days here matching their respective "YYYY-MM-DD" dateString keys
];