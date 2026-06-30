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

export const MONTH_THEME = "Knowing God";

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
  }, 
{
    dayNumber: 176,
    dateString: "2026-07-01",
    displayDate: "July 1, 2026",
    topic: "Eternal Life Begins With Knowing God",
    text: "John 17:3",
    memoryVerse: {
      verse: "“And this is life eternal, that they might know thee the only true God, and Jesus Christ, whom thou hast sent.”",
      reference: "John 17:3, KJV"
    },
    explanation: "Many people think eternal life begins after death, but Jesus said it begins by knowing God. Christianity is not primarily about church attendance, religious activities, or knowing Bible stories. It is about a real relationship with the Father through Jesus Christ. You can know about God without truly knowing Him. This month, your greatest pursuit should not be success, money, or influence. It should be knowing Jesus personally. Everything else flows from that relationship.",
    neededSteps: [
      "Spend time with God every day.",
      "Read the Bible to know Him, not just to gain information.",
      "Make knowing Jesus your highest priority."
    ],
    prayerPoints: [
      "Lord, reveal Yourself to me.",
      "Help me know You personally and deeply."
    ]
  },
  {
    dayNumber: 177,
    dateString: "2026-07-02",
    displayDate: "July 2, 2026",
    topic: "Knowing God Is Different From Knowing About Him",
    text: "Philippians 3:10",
    memoryVerse: {
      verse: "“That I may know him, and the power of his resurrection.”",
      reference: "Philippians 3:10, KJV"
    },
    explanation: "You can know facts about someone without having a relationship with them. Many people know Bible verses, attend church, and even serve in ministry, yet they hardly know Jesus personally. Paul had encounters with God, yet he still cried, \"That I may know Him.\" Knowing God is a lifelong pursuit. The deeper you know Him, the more your life changes. God is inviting you beyond information into intimacy.",
    neededSteps: [
      "Spend quiet time with God without rushing.",
      "Talk to God honestly in prayer.",
      "Desire relationship more than religion."
    ],
    prayerPoints: [
      "Lord, draw me closer to You.",
      "Let my relationship with You become deeper."
    ]
  },
  {
    dayNumber: 178,
    dateString: "2026-07-03",
    displayDate: "July 3, 2026",
    topic: "Jesus Wants Friends, Not Fans",
    text: "John 15:15",
    memoryVerse: {
      verse: "“Henceforth I call you not servants... but I have called you friends.”",
      reference: "John 15:15, KJV"
    },
    explanation: "Many people admire Jesus, but few truly walk with Him. A fan celebrates from a distance, but a friend stays close. Jesus did not die just to create followers who know His name. He died so we could have fellowship with Him. God desires friendship with you. He wants to be involved in your decisions, your struggles, your dreams, and your daily life. Don't settle for admiring Jesus from afar. Walk with Him closely.",
    neededSteps: [
      "Invite Jesus into every part of your day.",
      "Talk to Him as your closest friend.",
      "Listen for His direction through His Word."
    ],
    prayerPoints: [
      "Lord, teach me to walk closely with You.",
      "Let our relationship become real and personal."
    ]
  },
  {
    dayNumber: 179,
    dateString: "2026-07-04",
    displayDate: "July 4, 2026",
    topic: "Make Room for God",
    text: "James 4:8",
    memoryVerse: {
      verse: "“Draw nigh to God, and he will draw nigh to you.”",
      reference: "James 4:8, KJV"
    },
    explanation: "Relationships grow through time together. If you are too busy for God, your relationship with Him will become weak. Many young people spend hours on social media but struggle to spend fifteen minutes with God. Whatever you consistently make time for becomes important to you. If knowing God is your priority, you must intentionally create room for Him every day.",
    neededSteps: [
      "Set a daily time to meet with God.",
      "Reduce unnecessary distractions.",
      "Protect your quiet time with Him."
    ],
    prayerPoints: [
      "Lord, help me prioritize You.",
      "Give me a hunger for Your presence."
    ]
  },
  {
    dayNumber: 180,
    dateString: "2026-07-05",
    displayDate: "July 5, 2026",
    topic: "God Still Speaks",
    text: "John 10:27",
    memoryVerse: {
      verse: "“My sheep hear my voice, and I know them, and they follow me.”",
      reference: "John 10:27, KJV"
    },
    explanation: "One of the greatest blessings of knowing God is learning to recognize His voice. God is not silent. He still leads His children through His Word, His Spirit, and His wisdom. The question is not whether God is speaking. The question is whether we are listening. As your relationship with Him grows, your ability to recognize His voice also grows.",
    neededSteps: [
      "Read God's Word daily.",
      "Spend quiet moments listening in prayer.",
      "Obey the instructions God gives you."
    ],
    prayerPoints: [
      "Lord, teach me to hear Your voice.",
      "Help me obey You immediately."
    ]
  },
  {
    dayNumber: 181,
    dateString: "2026-07-06",
    displayDate: "July 6, 2026",
    topic: "Obedience Deepens Relationship",
    text: "John 14:21",
    memoryVerse: {
      verse: "“He that hath my commandments, and keepeth them, he it is that loveth me.”",
      reference: "John 14:21, KJV"
    },
    explanation: "Love for God is not measured by emotions alone. It is revealed through obedience. Every time you obey God, your relationship with Him grows stronger. Many people want intimacy with God while ignoring His instructions. But obedience is one of the clearest expressions of love. The more you obey, the more you experience Him.",
    neededSteps: [
      "Obey God's Word promptly.",
      "Stop delaying what God has instructed.",
      "Trust His wisdom above your feelings."
    ],
    prayerPoints: [
      "Lord, give me an obedient heart.",
      "Help me love You through my actions."
    ]
  },
  {
    dayNumber: 182,
    dateString: "2026-07-07",
    displayDate: "July 7, 2026",
    topic: "Don't Let Religion Replace Relationship",
    text: "Matthew 7:22-23",
    memoryVerse: {
      verse: "“And then will I profess unto them, I never knew you.”",
      reference: "Matthew 7:23, KJV"
    },
    explanation: "These are some of the most sobering words Jesus ever spoke. The people He addressed had preached, prophesied, and performed miracles, yet He said, \"I never knew you.\" Their problem was not a lack of activity. It was a lack of relationship. God is not impressed by how busy you are for Him if your heart is far from Him. This month, let your greatest desire be that Jesus truly knows you and that you truly know Him.",
    neededSteps: [
      "Examine your relationship with God honestly.",
      "Spend more time with Jesus than with religious activities.",
      "Pursue intimacy above performance."
    ],
    prayerPoints: [
      "Lord, remove every form of empty religion from my life.",
      "Let me truly know You, and let my life be pleasing to You."
    ]
  }
];