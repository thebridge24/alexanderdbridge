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
  },
  {
    dayNumber: 183,
    dateString: "2026-07-08",
    displayDate: "July 8, 2026",
    topic: "Knowing God Changes You",
    text: "2 Corinthians 3:18",
    memoryVerse: {
      verse: "“But we all, with open face beholding as in a glass the glory of the Lord, are changed into the same image from glory to glory.”",
      reference: "2 Corinthians 3:18, KJV"
    },
    explanation: "A genuine encounter with God never leaves a person the same. The more time you spend with Him, the more your thoughts, character, priorities, and desires begin to change. Many people are trying to change themselves through willpower alone, but true transformation comes from spending time in God's presence. If you consistently walk with Jesus, people will begin to notice something different about you. Your words will change. Your attitude will change. Your decisions will change. When you know Him, you gradually become like Him.",
    neededSteps: [
      "Spend quality time with God every day.",
      "Allow God's Word to correct you.",
      "Be willing to change where God is working on you."
    ],
    prayerPoints: [
      "Lord, transform me into Your image.",
      "Let my life reflect the character of Christ."
    ]
  },
  {
    dayNumber: 184,
    dateString: "2026-07-09",
    displayDate: "July 9, 2026",
    topic: "Moses Knew God's Ways",
    text: "Psalm 103:7",
    memoryVerse: {
      verse: "“He made known his ways unto Moses, his acts unto the children of Israel.”",
      reference: "Psalm 103:7, KJV"
    },
    explanation: "The children of Israel saw God's miracles, but Moses knew God's heart. There is a difference between knowing what God can do and knowing who He is. Many people seek God's hand because they want blessings, but very few seek His face because they simply want Him. God desires children who love Him beyond what He can give them. When you know His ways, you begin to trust Him even when you don't understand His works.",
    neededSteps: [
      "Seek God for who He is, not only for what He gives.",
      "Spend time studying His character.",
      "Trust Him even when life doesn't make sense."
    ],
    prayerPoints: [
      "Lord, reveal Your ways to me.",
      "Help me seek Your face above Your blessings."
    ]
  },
  {
    dayNumber: 185,
    dateString: "2026-07-10",
    displayDate: "July 10, 2026",
    topic: "Seek His Face First",
    text: "Matthew 6:33",
    memoryVerse: {
      verse: "“But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.”",
      reference: "Matthew 6:33, KJV"
    },
    explanation: "Many young people spend their energy chasing money, opportunities, relationships, and success, hoping God will fit into whatever time is left. Jesus teaches us a different order. He says to seek God first. This is not because God wants to deny you other things, but because He knows that when your relationship with Him is healthy, every other area of your life benefits. Let God become your first pursuit, not your last option.",
    neededSteps: [
      "Give God the first part of your day.",
      "Let your decisions honor Him.",
      "Make His will your priority."
    ],
    prayerPoints: [
      "Lord, help me put You first.",
      "Align my heart with Your kingdom."
    ]
  },
  {
    dayNumber: 186,
    dateString: "2026-07-11",
    displayDate: "July 11, 2026",
    topic: "Knowing God Gives Confidence",
    text: "Daniel 11:32",
    memoryVerse: {
      verse: "\"But the people that do know their God shall be strong, and do exploits.\"",
      reference: "Daniel 11:32, KJV"
    },
    explanation: "Notice that the Bible does not say people who know about God will do exploits. It says those who know their God. Confidence is born from relationship. David faced Goliath because he knew God. Daniel entered the lions' den because he knew God. The apostles stood before rulers because they knew God. The more you know Him, the less fear controls your life. Intimacy produces courage because you know who is standing with you.",
    neededSteps: [
      "Build your confidence through God's Word.",
      "Remember how God has helped you before.",
      "Face challenges knowing God is with you."
    ],
    prayerPoints: [
      "Lord, strengthen my confidence in You.",
      "Help me live boldly for Your glory."
    ]
  },
  {
    dayNumber: 187,
    dateString: "2026-07-12",
    displayDate: "July 12, 2026",
    topic: "God Wants Your Heart",
    text: "Proverbs 23:26",
    memoryVerse: {
      verse: "“My son, give me thine heart, and let thine eyes observe my ways.”",
      reference: "Proverbs 23:26, KJV"
    },
    explanation: "God is not after your gifts before He has your heart. He is not impressed by talent without surrender. Many people can sing, preach, lead, or serve while their hearts are far from Him. But God always starts with the heart because whatever has your heart eventually controls your life. When your heart belongs to God, obedience becomes easier, worship becomes genuine, and your relationship with Him becomes deeper.",
    neededSteps: [
      "Surrender every area of your life to God.",
      "Be honest with Him about your struggles.",
      "Guard your heart from distractions."
    ],
    prayerPoints: [
      "Lord, I give You my whole heart.",
      "Help me love You above everything else."
    ]
  },
  {
    dayNumber: 188,
    dateString: "2026-07-13",
    displayDate: "July 13, 2026",
    topic: "Learn to Wait on God",
    text: "Isaiah 40:31",
    memoryVerse: {
      verse: "“But they that wait upon the Lord shall renew their strength.”",
      reference: "Isaiah 40:31, KJV"
    },
    explanation: "Waiting on God is not wasting time. It is one of the ways relationships are built. We live in a generation that wants instant answers, instant success, and instant results. But God often develops people in the waiting season. Waiting teaches trust, patience, and dependence on Him. Don't rush ahead of God's timing. Some of His greatest lessons are learned while you wait.",
    neededSteps: [
      "Be patient with God's timing.",
      "Continue obeying while you wait.",
      "Trust that God is working behind the scenes."
    ],
    prayerPoints: [
      "Lord, teach me to wait on You.",
      "Strengthen my faith while I wait."
    ]
  },
  {
    dayNumber: 189,
    dateString: "2026-07-14",
    displayDate: "July 14, 2026",
    topic: "The Secret Place Changes Everything",
    text: "Psalm 91:1",
    memoryVerse: {
      verse: "“He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.”",
      reference: "Psalm 91:1, KJV"
    },
    explanation: "Every strong believer has a secret place. It is the place where no one is watching but God is present. Public victories are usually born from private encounters. Before Jesus ministered to crowds, He spent time alone with the Father. Before David defeated Goliath, he had already learned to know God in the lonely fields with the sheep. If you want your public life to carry power, your private life with God must be healthy. Never neglect your secret place because that is where God shapes you, strengthens you, and prepares you for your assignment.",
    neededSteps: [
      "Create a quiet place to meet with God.",
      "Protect your personal devotion time.",
      "Make fellowship with God a daily habit."
    ],
    prayerPoints: [
      "Lord, draw me into the secret place.",
      "Let my private walk with You become stronger."
    ]
  },
  {
    dayNumber: 190,
    dateString: "2026-07-15",
    displayDate: "July 15, 2026",
    topic: "God's Presence Is Your Greatest Treasure",
    text: "Exodus 33:15-16",
    memoryVerse: {
      verse: "“And he said unto him, If thy presence go not with me, carry us not up hence.”",
      reference: "Exodus 33:15, KJV"
    },
    explanation: "Moses understood something many people miss today. Success without God's presence is failure in disguise. He had the opportunity to enter the Promised Land, but he refused to go if God was not going with him. That should be the cry of every believer. As you pursue your career, business, ministry, academics, relationships, and dreams, never become so focused on the destination that you forget the One who is leading you. God's presence is worth more than promotion. His presence is worth more than money. His presence is worth more than applause. When you have Him, you have everything that truly matters.",
    neededSteps: [
      "Value God's presence above achievements.",
      "Ask for His direction before making decisions.",
      "Stay close to Him every day."
    ],
    prayerPoints: [
      "Lord, never let me walk without Your presence.",
      "Let knowing You remain the greatest pursuit of my life."
    ]
  }, 

{
    dayNumber: 191,
    dateString: "2026-07-16",
    displayDate: "July 16, 2026",
    topic: "God Knows Your Name",
    text: "Isaiah 43:1",
    memoryVerse: {
      verse: "“But now thus saith the Lord that created thee, O Jacob, and he that formed thee, O Israel, Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.”",
      reference: "Isaiah 43:1, KJV"
    },
    explanation: "One of the most comforting truths in Scripture is that God knows you personally. You are not just another face in the crowd or another person on the earth. He knows your name, your struggles, your dreams, your fears, and even the battles you have never told anyone about. Whether you are a student preparing for exams, a parent carrying the weight of your family, a worker trusting God for promotion, or someone waiting for a breakthrough, God sees you. Knowing that God knows you gives peace even when life feels uncertain. You never have to fight your battles alone because the One who created you walks with you every step of the way.",
    neededSteps: [
      "Thank God for His personal love for you.",
      "Talk to Him honestly about your life.",
      "Rest in the assurance that He cares for you."
    ],
    prayerPoints: [
      "Lord, thank You for knowing me personally.",
      "Help me trust Your love and care every day."
    ]
  },
  {
    dayNumber: 192,
    dateString: "2026-07-17",
    displayDate: "July 17, 2026",
    topic: "Knowing God Through His Word",
    text: "John 5:39",
    memoryVerse: {
      verse: "“Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.”",
      reference: "John 5:39, KJV"
    },
    explanation: "If someone asked you to describe your closest friend, you would have something to say because you have spent time together. The same is true with God. We know Him by spending time in His Word. The Bible is not just a book of stories or rules. It reveals the heart, character, and ways of God. Families become stronger when they read the Scriptures together. Young people make wiser decisions when they allow God's Word to shape their thinking. The more you read the Bible with a desire to know Jesus, the more your faith and understanding will grow.",
    neededSteps: [
      "Read a portion of the Bible every day.",
      "Ask God to speak to you as you read.",
      "Apply one lesson from His Word daily."
    ],
    prayerPoints: [
      "Lord, give me a love for Your Word.",
      "Reveal Yourself to me through the Scriptures."
    ]
  },
  {
    dayNumber: 193,
    dateString: "2026-07-18",
    displayDate: "July 18, 2026",
    topic: "Trust God Even When You Don't Understand",
    text: "Proverbs 3:5-6",
    memoryVerse: {
      verse: "“Trust in the Lord with all thine heart; and lean not unto thine own understanding.”",
      reference: "Proverbs 3:5, KJV"
    },
    explanation: "There will be seasons when life does not make sense. Prayers may seem unanswered. Doors may remain closed. Plans may change unexpectedly. During such moments, our relationship with God is tested. Knowing God means trusting His heart even when you cannot trace His hand. A child does not always understand a parent's decisions, yet trust remains. In the same way, God asks us to trust Him because He sees the end from the beginning. One day you will look back and understand why He led you the way He did.",
    neededSteps: [
      "Surrender your worries to God.",
      "Refuse to let fear control your decisions.",
      "Continue obeying even when you don't understand."
    ],
    prayerPoints: [
      "Lord, strengthen my trust in You.",
      "Help me follow You with confidence."
    ]
  },
  {
    dayNumber: 194,
    dateString: "2026-07-19",
    displayDate: "July 19, 2026",
    topic: "Knowing God Produces Humility",
    text: "Micac 6:8",
    memoryVerse: {
      verse: "“He hath shewed thee, O man, what is good... to do justly, and to love mercy, and to walk humbly with thy God.”",
      reference: "Micah 6:8, KJV"
    },
    explanation: "The closer you get to God, the more humble you become. Pride grows when people focus on themselves, but humility grows when people focus on God. Some think humility means thinking less of yourself, but true humility means seeing yourself correctly before God. Whether you are gifted, successful, wealthy, or influential, always remember that every good thing comes from Him. A humble heart is teachable, grateful, and willing to serve others. That is the kind of heart God delights in.",
    neededSteps: [
      "Thank God for every blessing in your life.",
      "Be willing to learn from others.",
      "Serve without seeking recognition."
    ],
    prayerPoints: [
      "Lord, keep my heart humble.",
      "Let my life always give You the glory."
    ]
  },
  {
    dayNumber: 195,
    dateString: "2026-07-20",
    displayDate: "July 20, 2026",
    topic: "Knowing God Changes the Atmosphere of Your Home",
    text: "Joshua 24:15",
    memoryVerse: {
      verse: "“But as for me and my house, we will serve the Lord.”",
      reference: "Joshua 24:15, KJV"
    },
    explanation: "A family becomes stronger when God is at the center. Homes are not transformed simply by having more money or bigger houses. They are transformed when parents, children, and siblings learn to know and honor God together. A family that prays together, forgives one another, and seeks God's wisdom creates an environment where peace can grow. Whether you live with your family or on your own, let your life bring the presence of God into your home. Someone in your house may come to know Christ because they first saw Him in you.",
    neededSteps: [
      "Pray with your family whenever possible.",
      "Speak words that build your home.",
      "Let your lifestyle reflect Christ."
    ],
    prayerPoints: [
      "Lord, let Your presence fill my home.",
      "Draw every member of my family closer to You."
    ]
  },
  {
    dayNumber: 196,
    dateString: "2026-07-21",
    displayDate: "July 21, 2026",
    topic: "God Is Looking for Available Hearts",
    text: "Isaiah 6:8",
    memoryVerse: {
      verse: "“Also I heard the voice of the Lord, saying, Whom shall I send, and who will go for us? Then said I, Here am I; send me.”",
      reference: "Isaiah 6:8, KJV"
    },
    explanation: "God has always worked through people who made themselves available. Isaiah was not chosen because he was perfect. He responded because his heart was willing. God is still asking the same question today. Who will represent Me in the classroom? Who will stand for truth in the office? Who will bring hope to the community? Who will serve with love in the family? Knowing God should move us beyond personal blessings into purposeful living. The greatest evidence that you know Him is that you become available for His work wherever He places you.",
    neededSteps: [
      "Ask God how He wants to use your life.",
      "Be willing to serve wherever He leads.",
      "Represent Christ through your words and actions."
    ],
    prayerPoints: [
      "Lord, make me available for Your purpose.",
      "Use my life to reveal Your love to others."
    ]
  }
];