const DEVOTIONAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDevotionalDate(date: string): boolean {
  if (!DEVOTIONAL_DATE_REGEX.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

/**
 * Formats an ISO string into a human-readable relative duration.
 */
export function formatRelativeTime(isoDate?: string | null): string {
  if (!isoDate) return "Just now";

  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return "Just now";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w ago`;
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a YYYY-MM-DD string into "Monday, January 1, 2026" display title.
 */
export function formatDevotionalDisplayDate(dateStr: string): string {
  if (!isValidDevotionalDate(dateStr)) return dateStr;
  const parsed = new Date(`${dateStr}T00:00:00`);
  return parsed.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

