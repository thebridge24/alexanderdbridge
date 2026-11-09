import { sendPushToAll } from "@/lib/notifications/sender";

type ReminderSlot = "morning" | "afternoon" | "evening";

const MESSAGES: Record<
  ReminderSlot,
  { title: string; body: string }[]
> = {
  morning: [
    {
      title: "Before the Day Gets Busy",
      body: "Before everything else takes your attention today, make a little room for God. Your devotional is ready.",
    },
    {
      title: "Good Morning, Bridge Tribe",
      body: "A new day, a fresh opportunity to grow. Have you spent time in the Word today?",
    },
    {
      title: "Your Time with God",
      body: "You have plans for today, but don't forget the One who gives you wisdom for the journey.",
    },
    {
      title: "Start with the Word",
      body: "Even if today gets busy, give God a few minutes first. Today's devotional is ready.",
    },
    {
      title: "A New Day with God",
      body: "Let's keep growing together. Take a moment to read, reflect and pray before the day runs away.",
    },
    {
      title: "Don't Miss Today",
      body: "Yesterday is gone, and today is another opportunity to grow. Your devotional is ready.",
    },
    {
      title: "Your Daily Reminder",
      body: "You don't need hours to begin. Start with a few quiet minutes in God's Word today.",
    },
  ],afternoon: [
  {
    title: "A Moment with God",
    body: "The day is moving, but don't let your responsibilities take away your time with God. Have you read today's devotional?",
  },
  {
    title: "How Is Your Day Going?",
    body: "In the middle of everything you're doing today, remember to make room for God's Word. Your devotional is waiting.",
  },
  {
    title: "Don't Forget Your Devotional",
    body: "You have made time for many things today. Take a few minutes to nourish your spirit too.",
  },
  {
    title: "Pause and Hear God",
    body: "Before the day gets any further, take a moment to read, reflect and listen to what God is saying.",
  },
  {
    title: "Your Afternoon Reminder",
    body: "Don't allow the busyness of life to push your fellowship with God aside. Today's Word is ready.",
  },
  {
    title: "Stay Consistent",
    body: "Your walk with God is built through daily fellowship. If you haven't read today's devotional, there's still time.",
  },
  {
    title: "A Little Time for Eternity",
    body: "So much of your day is spent on temporary things. Take a moment to invest in your spiritual growth.",
  },
],
  evening: [
    {
      title: "Before You Sleep",
      body: "Before you call it a day, have you spent time with God? There's still time to read today's devotional.",
    },
    {
      title: "Let's Keep the Streak",
      body: "Don't let a busy day make you forget what matters. Take a few minutes for today's Word.",
    },
    {
      title: "A Few Minutes for God",
      body: "The day may have been demanding, but you can still pause, reflect and pray.",
    },
    {
      title: "Have You Read Today?",  
      body: "Just checking in. Have you had your time in the Word today? Your devotional is waiting.",
    },
    {
      title: "Your Day Isn't Over Yet",
      body: "If work, school or other responsibilities took over your day, take a quiet moment with God tonight.",
    },
    {
      title: "Keep Showing Up",
      body: "Growth comes from showing up consistently. Make a little time for today's devotional.",
    },
    {
      title: "One More Step Forward",
      body: "Every day is another chance to grow. Don't forget to read, reflect and pray before you rest.",
    },
    {
      title: "Before the Day Ends",
      body: "Take a breath, open the Word and give yourself a few minutes with God before you sleep.",
    },
  ],
};

function getLagosDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export async function sendDevotionalReminder(
  slot: ReminderSlot,
) {
  const messages = MESSAGES[slot];
  const message =
    messages[Math.floor(Math.random() * messages.length)];

  const date = getLagosDate();

  const result = await sendPushToAll(
    message.title,
    message.body,
    `/devotional/${date}`,
    "admin",
  );

  if (!result.ok) {
    throw new Error(
      result.error || "Failed to send devotional reminder",
    );
  }

  return {
    success: true,
    slot,
    date,
    title: message.title,
    publishId: result.publishId,
  };
}