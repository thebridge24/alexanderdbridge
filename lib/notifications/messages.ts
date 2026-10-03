export interface DevotionalNotificationPayload {
  type: "like" | "reply" | "comment" | "reminder" | "streak" | "milestone" | "admin";
  title: string;
  body: string;
  link: string;
  dedupeKey?: string;
}

export function formatCommentLikeMessage(
  actorName: string,
  devotionalDateDisplay: string,
  devotionalDateString: string,
  commentId: string,
  actorUserId?: string,
): DevotionalNotificationPayload {
  const name = actorName.trim() || "Someone";
  const dateText = devotionalDateDisplay || devotionalDateString;
  return {
    type: "like",
    title: "New Like ❤️",
    body: `${name} liked your comment on ${dateText}`,
    link: `/devotional/${devotionalDateString}?comment=${commentId}`,
    dedupeKey: actorUserId ? `like:${commentId}:${actorUserId}` : undefined,
  };
}

export function formatCommentReplyMessage(
  actorName: string,
  replyText: string,
  devotionalDateString: string,
  commentId: string,
  replyId: string,
): DevotionalNotificationPayload {
  const name = actorName.trim() || "Someone";
  const snippet = replyText.length > 60 ? `${replyText.slice(0, 57)}...` : replyText;
  return {
    type: "reply",
    title: "New Reply 💬",
    body: `${name} replied to your comment: "${snippet}"`,
    link: `/devotional/${devotionalDateString}?comment=${commentId}&reply=${replyId}`,
    dedupeKey: `reply:${replyId}`,
  };
}

export function formatDevotionalCommentMessage(
  actorName: string,
  topic: string,
  devotionalDateString: string,
  commentId: string,
): DevotionalNotificationPayload {
  const name = actorName.trim() || "Someone";
  const topicSnippet = topic.length > 50 ? `${topic.slice(0, 47)}...` : topic;
  return {
    type: "comment",
    title: "New Devotional Comment ✍️",
    body: `${name} commented on the devotional: "${topicSnippet}"`,
    link: `/devotional/${devotionalDateString}?comment=${commentId}`,
    dedupeKey: `comment:${commentId}`,
  };
}

export function formatMorningReminderMessage(
  topic: string,
  devotionalDateString: string,
  userId: string,
): DevotionalNotificationPayload {
  return {
    type: "reminder",
    title: "Good morning ☀️",
    body: `Today's devotional "${topic}" is ready for you. Take a few minutes with God.`,
    link: `/devotional/${devotionalDateString}`,
    dedupeKey: `reminder:${userId}:${devotionalDateString}`,
  };
}

export function formatStreakSaverMessage(
  currentStreak: number,
  devotionalDateString: string,
  userId: string,
): DevotionalNotificationPayload {
  return {
    type: "streak",
    title: "Don't lose your streak! 🔥",
    body: `You have an active ${currentStreak}-day streak. Spend 5 minutes with today's devotional to keep it going!`,
    link: `/devotional/${devotionalDateString}`,
    dedupeKey: `streak:${userId}:${devotionalDateString}`,
  };
}

export function formatWinbackMessage(
  devotionalDateString: string,
  userId: string,
): DevotionalNotificationPayload {
  return {
    type: "streak",
    title: "We miss you 🙏",
    body: "Your daily devotional is waiting for you. Reconnect with God and His Word today.",
    link: `/devotional/${devotionalDateString}`,
    dedupeKey: `winback:${userId}:${devotionalDateString}`,
  };
}

export function formatMilestoneMessage(
  medalName: string,
  targetDays: number,
  devotionalDateString: string,
  userId: string,
): DevotionalNotificationPayload {
  return {
    type: "milestone",
    title: "🏅 Milestone Unlocked!",
    body: `Congratulations! You unlocked the ${medalName} milestone (${targetDays}-day streak)!`,
    link: `/devotional/${devotionalDateString}`,
    dedupeKey: `milestone:${userId}:${targetDays}`,
  };
}
