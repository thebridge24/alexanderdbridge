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
  {
    dayNumber: 1,
    dateString: "2026-09-22",
    displayDate: "September 22, 2026",
    topic: "The Secret Place",
    text: "Psalm 91:1",
    memoryVerse: {
      verse:
        "He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty.",
      reference: "Psalm 91:1",
    },
    explanation:
      "The Christian life does not begin with noise; it begins with stillness. Before the world demands your attention, God calls you into His presence. When you dwell with Him, His covering becomes your security.",
    neededSteps: [
      "Set aside a few quiet minutes before your day begins.",
      "Read a short scripture passage and pause to listen for God.",
      "Carry one truth with you for the rest of the day.",
    ],
    prayerPoints: [
      "Lord, teach me to dwell in Your presence daily.",
      "Let Your peace guard my heart in every situation.",
      "Help me remember that Your shadow is enough for me.",
    ],
  },
  {
    dayNumber: 2,
    dateString: "2026-09-23",
    displayDate: "September 23, 2026",
    topic: "Grace for the Next Step",
    text: "Isaiah 43:19",
    memoryVerse: {
      verse:
        "Behold, I am doing a new thing; now it springs forth, do you not perceive it?",
      reference: "Isaiah 43:19",
    },
    explanation:
      "God is not asking you to carry yesterday's burden into today. He is inviting you to see the new thing He is already doing. Faith grows when we trust the next step even before we see the whole path.",
    neededSteps: [
      "Name one burden you need to lay down before God.",
      "Ask Him for clarity on the next step He wants you to take.",
      "Move in obedience even if the full picture is not yet visible.",
    ],
    prayerPoints: [
      "Father, show me the new thing You are doing in my life.",
      "Give me courage to step forward in faith.",
      "Let me trust Your leading more than my fear.",
    ],
  },
  {
    dayNumber: 3,
    dateString: "2026-09-24",
    displayDate: "September 24, 2026",
    topic: "Rooted in His Love",
    text: "Romans 8:38-39",
    memoryVerse: {
      verse:
        "Nothing can separate us from the love of God that is in Christ Jesus our Lord.",
      reference: "Romans 8:39",
    },
    explanation:
      "The deepest security of the believer is not in achievement, recognition, or comfort — it is in God's unchanging love. When we know we are loved by Him, fear loses its voice and obedience becomes easier.",
    neededSteps: [
      "Take five minutes to reflect on the love of God.",
      "Write down one area where fear has been louder than faith.",
      "Pray for a heart that rests in His affection.",
    ],
    prayerPoints: [
      "Lord, help me live from Your love and not from my insecurity.",
      "Let Your presence quiet my fears today.",
      "Remind me that nothing can separate me from Your love.",
    ],
  },
];