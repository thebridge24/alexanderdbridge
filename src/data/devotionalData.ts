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

export const MONTH_THEME = "Arise And Shine";

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
  },
  {
    dayNumber: 174,
    dateString: "2026-06-29",
    displayDate: "June 29, 2026",
    topic: "Shine Through Loyalty",
    text: "Luke 16:10",
    memoryVerse: {
      verse: "“He that is faithful in that which is least is faithful also in much.”",
      reference: "Luke 16:10, KJV"
    },
    explanation: "One quality that is becoming rare today is loyalty. Many people are committed only when it benefits them. But God's kingdom operates differently. Loyalty to God, to purpose, to responsibilities, and to righteous relationships builds trust. Joseph remained faithful even when nobody was watching. David remained loyal even when Saul mistreated him. Your ability to stay faithful during difficult seasons is part of what prepares you for greater opportunities.",
    neededSteps: [
      "Be faithful in your current responsibilities.",
      "Honor your commitments.",
      "Remain trustworthy in small matters."
    ],
    prayerPoints: [
      "Lord, build faithfulness in me.",
      "Help me become trustworthy and dependable."
    ]
  },
  {
    dayNumber: 175,
    dateString: "2026-06-30",
    displayDate: "June 30, 2026",
    topic: "Keep Rising, Keep Shining",
    text: "Isaiah 60:1-3",
    memoryVerse: {
      verse: "“Arise, shine; for thy light is come, and the glory of the Lord is risen upon thee.”",
      reference: "Isaiah 60:1, KJV"
    },
    explanation: "As this month comes to an end, the instruction remains the same. Arise and shine. This was never meant to be a thirty-day theme. It is a lifestyle. Every new level in life will require you to arise again. Every new opportunity will require you to shine again. The world is full of darkness, confusion, and problems, but God is raising men and women who carry His light. Do not return to hiding. Do not return to fear. Do not return to small thinking. Keep growing. Keep building. Keep serving. Keep solving problems. Keep becoming the bridge God has called you to be. The journey is only beginning.",
    neededSteps: [
      "Review the lessons from this month.",
      "Continue growing intentionally.",
      "Commit to shining wherever God places you."
    ],
    prayerPoints: [
      "Lord, let Your light continually shine through me.",
      "Help me become everything You created me to be.",
      "Let my life bring glory to You and impact to my generation."
    ]
  }
];