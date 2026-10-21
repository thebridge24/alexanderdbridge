export interface ChapterAssignment {
  book: string;
  chapter: number;
}

export interface DailyReading {
  dayOfYear: number;
  reference: string;
  chapters: ChapterAssignment[];
}

// All 66 books with chapter counts
const BIBLE_STRUCTURE: { book: string; chapters: number }[] = [
  { book: 'Genesis', chapters: 50 },
  { book: 'Exodus', chapters: 40 },
  { book: 'Leviticus', chapters: 27 },
  { book: 'Numbers', chapters: 36 },
  { book: 'Deuteronomy', chapters: 34 },
  { book: 'Joshua', chapters: 24 },
  { book: 'Judges', chapters: 21 },
  { book: 'Ruth', chapters: 4 },
  { book: '1 Samuel', chapters: 31 },
  { book: '2 Samuel', chapters: 24 },
  { book: '1 Kings', chapters: 22 },
  { book: '2 Kings', chapters: 25 },
  { book: '1 Chronicles', chapters: 29 },
  { book: '2 Chronicles', chapters: 36 },
  { book: 'Ezra', chapters: 10 },
  { book: 'Nehemiah', chapters: 13 },
  { book: 'Esther', chapters: 10 },
  { book: 'Job', chapters: 42 },
  { book: 'Psalms', chapters: 150 },
  { book: 'Proverbs', chapters: 31 },
  { book: 'Ecclesiastes', chapters: 12 },
  { book: 'Song of Solomon', chapters: 8 },
  { book: 'Isaiah', chapters: 66 },
  { book: 'Jeremiah', chapters: 52 },
  { book: 'Lamentations', chapters: 5 },
  { book: 'Ezekiel', chapters: 48 },
  { book: 'Daniel', chapters: 12 },
  { book: 'Hosea', chapters: 14 },
  { book: 'Joel', chapters: 3 },
  { book: 'Amos', chapters: 9 },
  { book: 'Obadiah', chapters: 1 },
  { book: 'Jonah', chapters: 4 },
  { book: 'Micah', chapters: 7 },
  { book: 'Nahum', chapters: 3 },
  { book: 'Habakkuk', chapters: 3 },
  { book: 'Zephaniah', chapters: 3 },
  { book: 'Haggai', chapters: 2 },
  { book: 'Zechariah', chapters: 14 },
  { book: 'Malachi', chapters: 4 },
  { book: 'Matthew', chapters: 28 },
  { book: 'Mark', chapters: 16 },
  { book: 'Luke', chapters: 24 },
  { book: 'John', chapters: 21 },
  { book: 'Acts', chapters: 28 },
  { book: 'Romans', chapters: 16 },
  { book: '1 Corinthians', chapters: 16 },
  { book: '2 Corinthians', chapters: 13 },
  { book: 'Galatians', chapters: 6 },
  { book: 'Ephesians', chapters: 6 },
  { book: 'Philippians', chapters: 4 },
  { book: 'Colossians', chapters: 4 },
  { book: '1 Thessalonians', chapters: 5 },
  { book: '2 Thessalonians', chapters: 3 },
  { book: '1 Timothy', chapters: 6 },
  { book: '2 Timothy', chapters: 4 },
  { book: 'Titus', chapters: 3 },
  { book: 'Philemon', chapters: 1 },
  { book: 'Hebrews', chapters: 13 },
  { book: 'James', chapters: 5 },
  { book: '1 Peter', chapters: 5 },
  { book: '2 Peter', chapters: 3 },
  { book: '1 John', chapters: 5 },
  { book: '2 John', chapters: 1 },
  { book: '3 John', chapters: 1 },
  { book: 'Jude', chapters: 1 },
  { book: 'Revelation', chapters: 22 },
];

/**
 * Generates the complete 365-day schedule dynamically.
 */
export function generate365Schedule(): DailyReading[] {
  const allChapters: ChapterAssignment[] = [];
  for (const b of BIBLE_STRUCTURE) {
    for (let ch = 1; ch <= b.chapters; ch++) {
      allChapters.push({ book: b.book, chapter: ch });
    }
  }

  const totalChapters = allChapters.length; // 1189
  const schedule: DailyReading[] = [];
  let currentIndex = 0;

  for (let day = 1; day <= 365; day++) {
    // Distribute remaining chapters across remaining days
    const remainingDays = 365 - day + 1;
    const remainingChapters = totalChapters - currentIndex;
    const chaptersForTodayCount = Math.round(remainingChapters / remainingDays);

    const dayChapters = allChapters.slice(currentIndex, currentIndex + chaptersForTodayCount);
    currentIndex += chaptersForTodayCount;

    schedule.push({
      dayOfYear: day,
      reference: formatReference(dayChapters),
      chapters: dayChapters,
    });
  }

  return schedule;
}

function formatReference(chapters: ChapterAssignment[]): string {
  if (chapters.length === 0) return '';
  const first = chapters[0];
  const last = chapters[chapters.length - 1];

  if (first.book === last.book) {
    if (first.chapter === last.chapter) {
      return `${first.book} ${first.chapter}`;
    }
    return `${first.book} ${first.chapter}–${last.chapter}`;
  }
  return `${first.book} ${first.chapter} – ${last.book} ${last.chapter}`;
}

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  return Math.min(day, 365); // Cap leap years at 365
}

export function getReadingForDate(date: Date = new Date()): DailyReading {
  const dayOfYear = getDayOfYear(date);
  const schedule = generate365Schedule();
  return schedule[dayOfYear - 1] || schedule[0];
}