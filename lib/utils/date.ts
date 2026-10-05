const DEVOTIONAL_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDevotionalDate(date: string): boolean {
  if (!DEVOTIONAL_DATE_REGEX.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function formatRelativeTime(isoDate: string): string {
  const timestamp = new Date(isoDate).getTime();
  if (Number.isNaN(timestamp)) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
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
  return `${days}d ago`;
}
