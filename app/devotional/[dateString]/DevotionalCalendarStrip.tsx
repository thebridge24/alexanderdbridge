"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  Devotional,
  DEVOTIONALS_DATA,
} from "../../data/devotionalData";

interface DevotionalCalendarStripProps {
  currentDateString: string;
  onSelectDevotional: (devotional: Devotional) => void;
  onDevotionalsLoaded?: (devotionals: Devotional[]) => void;
}

function getLocalDateString(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthKey(dateString: string): string {
  return dateString.slice(0, 7);
}

function formatMonthHeader(dateString: string): string {
  if (!dateString) return "";

  const [year, month] = dateString.split("-").map(Number);

  if (!year || !month || month < 1 || month > 12) {
    return "";
  }

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);

  const previousMonth = new Date(year, month - 2, 1);

  const previousYear = previousMonth.getFullYear();
  const previousMonthNumber = String(
    previousMonth.getMonth() + 1
  ).padStart(2, "0");

  return `${previousYear}-${previousMonthNumber}`;
}

function getDayLabel(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-US",
    { weekday: "short" }
  );
}

function getDayNumber(dateString: string): string {
  return dateString.split("-")[2] ?? "";
}

function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function DevotionalCalendarStrip({
  currentDateString,
  onSelectDevotional,
  onDevotionalsLoaded,
}: DevotionalCalendarStripProps) {
  const router = useRouter();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayStr = useRef(getLocalDateString()).current;

  // Keep the latest props available to the initial loading effect.
  const currentDateRef = useRef(currentDateString);
  const onLoadedRef = useRef(onDevotionalsLoaded);

  useEffect(() => {
    currentDateRef.current = currentDateString;
  }, [currentDateString]);

  useEffect(() => {
    onLoadedRef.current = onDevotionalsLoaded;
  }, [onDevotionalsLoaded]);

  const [loadedDevotionals, setLoadedDevotionals] =
    useState<Devotional[]>([]);

  const [allApiDevotionals, setAllApiDevotionals] =
    useState<Devotional[]>([]);

  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);

  const [isLoadingPreviousMonth, setIsLoadingPreviousMonth] =
    useState(false);

  const [hasMorePastMonths, setHasMorePastMonths] =
    useState(true);

  const [visibleMonthName, setVisibleMonthName] = useState("");

  const [loadError, setLoadError] = useState(false);

  // Load devotional data once when the component mounts.
  useEffect(() => {
    let cancelled = false;

    async function loadInitialMonth() {
      let list: Devotional[] = DEVOTIONALS_DATA;

      try {
        const response = await fetch("/api/devotionals", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load devotionals: HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (
          Array.isArray(data.devotionals) &&
          data.devotionals.length > 0
        ) {
          list = data.devotionals;
        }
      } catch (error) {
        console.error(
          "Unable to load devotional API data. Using local data:",
          error
        );

        list = DEVOTIONALS_DATA;

        if (list.length === 0) {
          if (!cancelled) {
            setLoadError(true);
          }

          return;
        }
      }

      if (cancelled) return;

      // Remove malformed dates and duplicate entries.
      const uniqueDevotionals = new Map<string, Devotional>();

      for (const devotional of list) {
        if (
          devotional &&
          typeof devotional.dateString === "string" &&
          isValidDateString(devotional.dateString)
        ) {
          uniqueDevotionals.set(
            devotional.dateString,
            devotional
          );
        }
      }

      const sortedDevotionals = Array.from(
        uniqueDevotionals.values()
      ).sort((a, b) =>
        a.dateString.localeCompare(b.dateString)
      );

      if (sortedDevotionals.length === 0) {
        setLoadError(true);
        return;
      }

      setLoadError(false);
      setAllApiDevotionals(sortedDevotionals);

      // Notify the parent. The parent owns the active devotional.
      onLoadedRef.current?.(sortedDevotionals);

      const requestedDate =
        currentDateRef.current || todayStr;

      const requestedMonth = getMonthKey(requestedDate);

      let targetMonth = requestedMonth;

      let monthItems = sortedDevotionals.filter(
        (devotional) =>
          getMonthKey(devotional.dateString) === requestedMonth
      );

      // If the requested month has no entries, use the closest
      // available month instead of mixing dates from different months.
      if (monthItems.length === 0) {
        const previousOrSame = sortedDevotionals.filter(
          (devotional) =>
            devotional.dateString <= requestedDate
        );

        const fallback =
          previousOrSame[previousOrSame.length - 1] ??
          sortedDevotionals[0];

        targetMonth = getMonthKey(fallback.dateString);

        monthItems = sortedDevotionals.filter(
          (devotional) =>
            getMonthKey(devotional.dateString) === targetMonth
        );
      }

      if (cancelled) return;

      setLoadedDevotionals(monthItems);
      setLoadedMonths([targetMonth]);

      const firstDate = monthItems[0]?.dateString;

      setVisibleMonthName(
        formatMonthHeader(firstDate ?? requestedDate)
      );

      // Do not call onSelectDevotional here.
      // The parent handles selection after receiving the data.
    }

    void loadInitialMonth();

    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  // Load the previous month when the user scrolls to the left.
  const loadPreviousMonth = useCallback(() => {
    if (
      isLoadingPreviousMonth ||
      !hasMorePastMonths ||
      loadedMonths.length === 0
    ) {
      return;
    }

    const oldestLoadedMonth = loadedMonths[0];

    if (!oldestLoadedMonth) return;

    const previousMonthKey =
      getPreviousMonthKey(oldestLoadedMonth);

    const previousMonthItems = allApiDevotionals.filter(
      (devotional) =>
        getMonthKey(devotional.dateString) === previousMonthKey
    );

    if (previousMonthItems.length === 0) {
      // There are no entries for the immediately previous month.
      // Look farther back rather than stopping prematurely.
      const olderDevotionals = allApiDevotionals.filter(
        (devotional) =>
          devotional.dateString <
          `${oldestLoadedMonth}-01`
      );

      if (olderDevotionals.length === 0) {
        setHasMorePastMonths(false);
        return;
      }

      const oldestAvailableDate =
        olderDevotionals[0].dateString;

      const oldestAvailableMonth =
        getMonthKey(oldestAvailableDate);

      const olderMonthItems = allApiDevotionals.filter(
        (devotional) =>
          getMonthKey(devotional.dateString) ===
          oldestAvailableMonth
      );

      if (olderMonthItems.length === 0) {
        setHasMorePastMonths(false);
        return;
      }

      prependMonth(
        oldestAvailableMonth,
        olderMonthItems
      );

      return;
    }

    prependMonth(previousMonthKey, previousMonthItems);
  }, [
    isLoadingPreviousMonth,
    hasMorePastMonths,
    loadedMonths,
    allApiDevotionals,
  ]);

  function prependMonth(
    monthKey: string,
    monthItems: Devotional[]
  ) {
    setIsLoadingPreviousMonth(true);

    const container = scrollContainerRef.current;
    const previousScrollWidth =
      container?.scrollWidth ?? 0;

    setLoadedDevotionals((previous) => {
      const existingDates = new Set(
        previous.map((item) => item.dateString)
      );

      const newItems = monthItems.filter(
        (item) => !existingDates.has(item.dateString)
      );

      return [...newItems, ...previous];
    });

    setLoadedMonths((previous) => {
      if (previous.includes(monthKey)) {
        return previous;
      }

      return [monthKey, ...previous];
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const currentContainer =
          scrollContainerRef.current;

        if (currentContainer) {
          const widthDifference =
            currentContainer.scrollWidth -
            previousScrollWidth;

          currentContainer.scrollLeft += widthDifference;
        }

        setIsLoadingPreviousMonth(false);
      });
    });
  }

  // Update the month label and load older entries when necessary.
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container) return;

    if (container.scrollLeft < 40) {
      loadPreviousMonth();
    }

    const containerRect = container.getBoundingClientRect();
    const centerX =
      containerRect.left + containerRect.width / 2;

    const children = Array.from(
      container.querySelectorAll<HTMLElement>("[data-date]")
    );

    let closestElement: HTMLElement | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const child of children) {
      const rect = child.getBoundingClientRect();

      if (
        rect.right < containerRect.left ||
        rect.left > containerRect.right
      ) {
        continue;
      }

      const childCenter = rect.left + rect.width / 2;
      const distance = Math.abs(centerX - childCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestElement = child;
      }
    }

    const dateString =
      closestElement?.getAttribute("data-date");

    if (dateString) {
      const nextMonthName = formatMonthHeader(dateString);

      setVisibleMonthName((previous) =>
        previous === nextMonthName
          ? previous
          : nextMonthName
      );
    }
  }, [loadPreviousMonth]);

  // Bring the active devotional into view when it is present.
  useEffect(() => {
    if (!currentDateString || loadedDevotionals.length === 0) {
      return;
    }

    const container = scrollContainerRef.current;

    if (!container) return;

    const activeElement = Array.from(
      container.querySelectorAll<HTMLElement>("[data-date]")
    ).find(
      (element) =>
        element.dataset.date === currentDateString
    );

    activeElement?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [currentDateString, loadedDevotionals]);

  function handleSelect(devotional: Devotional) {
    onSelectDevotional(devotional);

    router.push(`/devotional/${devotional.dateString}`);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative z-50 mb-4 w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="rounded-full border border-red-900/40 bg-red-950/40 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-red-500">
          {visibleMonthName || "Daily Devotional"}
        </span>

        <span className="font-mono text-[10px] uppercase text-neutral-500">
          Daily Bread
        </span>
      </div>

      <div className="relative flex items-center">
        {isLoadingPreviousMonth && (
          <div className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/80">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="no-scrollbar flex w-full snap-x gap-2.5 overflow-x-auto scroll-smooth px-1 py-2"
        >
          {loadedDevotionals.map((item) => {
            const isSelected =
              item.dateString === currentDateString;

            const isFuture = item.dateString > todayStr;

            return (
              <button
                key={item.dateString}
                type="button"
                data-date={item.dateString}
                disabled={isFuture}
                aria-pressed={isSelected}
                aria-label={`Open devotional for ${item.dateString}`}
                onClick={() => handleSelect(item)}
                className={`group flex w-14 shrink-0 snap-center flex-col rounded-2xl border transition-all duration-300 ${
                  isFuture
                    ? "pointer-events-none cursor-not-allowed border-transparent opacity-20"
                    : "cursor-pointer"
                } ${
                  isSelected
                    ? "scale-105 border-white/30 bg-[#ff0000] text-white shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    : "border-neutral-800/60 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <span
                  className={`block pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    isSelected
                      ? "text-white"
                      : "text-neutral-500 group-hover:text-neutral-400"
                  }`}
                >
                  {getDayLabel(item.dateString)}
                </span>

                <div
                  className={`w-full rounded-t-xl bg-black/30 pb-3 pt-0.5 text-center text-base font-bold ${
                    isSelected
                      ? "text-white"
                      : "text-neutral-200"
                  }`}
                >
                  {getDayNumber(item.dateString)}
                </div>
              </button>
            );
          })}

          {!loadError && loadedDevotionals.length === 0 && (
            <div className="px-3 py-4 text-sm text-neutral-500">
              Loading devotionals...
            </div>
          )}

          {loadError && loadedDevotionals.length === 0 && (
            <div className="px-3 py-4 text-sm text-red-400">
              Unable to load devotionals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}