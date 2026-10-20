
/* ==============================
   DATA
================================ */

type FormatDateOptions = {
  includeTime?: boolean;
  includeWeekday?: boolean;
  locale?: string;
};

const DEFAULT_LOCALE = "en-NG";

/* ==============================
   LOGIC
================================ */

export function formatDate(
  date: string | number | Date | null | undefined,
  options: FormatDateOptions = {}
): string {
  const { includeTime = false, includeWeekday = false, locale = DEFAULT_LOCALE } = options;

  if (date === null || date === undefined || date === "") {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  if (includeWeekday) {
    dateOptions.weekday = "short";
  }

  if (includeTime) {
    dateOptions.hour = "numeric";
    dateOptions.minute = "2-digit";
    dateOptions.hour12 = true;
  }

  return new Intl.DateTimeFormat(locale, dateOptions).format(parsedDate);
}
