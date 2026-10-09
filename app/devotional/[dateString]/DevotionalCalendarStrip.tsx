"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Devotional, DEVOTIONALS_DATA } from "../../data/devotionalData";

interface DevotionalCalendarStripProps {
  currentDateString: string;
  onSelectDevotional: (devotional: Devotional) => void;
  onDevotionalsLoaded?: (devotionals: Devotional[]) => void;
}

export default function DevotionalCalendarStrip({
  currentDateString,
  onSelectDevotional,
  onDevotionalsLoaded,
}: DevotionalCalendarStripProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Loaded Devotionals State
  const [loadedDevotionals, setLoadedDevotionals] = useState<Devotional[]>([]);
  const [allApiDevotionals, setAllApiDevotionals] = useState<Devotional[]>([]);
  
  // Track loaded months (format: YYYY-MM)
  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
  const [isLoadingPreviousMonth, setIsLoadingPreviousMonth] = useState<boolean>(false);
  const [hasMorePastMonths, setHasMorePastMonths] = useState<boolean>(true);

  // Current active visible month display label
  const [visibleMonthName, setVisibleMonthName] = useState<string>("");

  const todayStr = useRef<string>(
    new Date().toISOString().split("T")[0]
  ).current;

  // Helper: Format YYYY-MM into readable Month Year (e.g., "October 2026")
  const formatMonthHeader = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Helper: Get YYYY-MM key from date string
  const getMonthKey = (dateStr: string) => {
    return dateStr.substring(0, 7);
  };

  // Helper: Get previous month key
  const getPreviousMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1);
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  };

  // 1. Initial Load: Fetch API devotionals & render ONLY current month
  useEffect(() => {
    let isMounted = true;

    async function loadInitialMonth() {
      try {
        const res = await fetch("/api/devotionals");
        let list: Devotional[] = DEVOTIONALS_DATA;

        if (res.ok) {
          const data = await res.json();
          if (data.devotionals && data.devotionals.length > 0) {
            list = data.devotionals;
          }
        }

        if (!isMounted) return;

        setAllApiDevotionals(list);
        if (onDevotionalsLoaded) onDevotionalsLoaded(list);

        // Determine target active month (from currentDateString or today)
        const targetDate = currentDateString || todayStr;
        const targetMonthKey = getMonthKey(targetDate);

        // Filter devotionals belonging ONLY to target month
        const currentMonthItems = list.filter(
          (d) => getMonthKey(d.dateString) === targetMonthKey
        );

        setLoadedDevotionals(currentMonthItems);
        setLoadedMonths([targetMonthKey]);
        setVisibleMonthName(formatMonthHeader(targetDate));

        // Select initial devotional
        const initialSelected =
          currentMonthItems.find((d) => d.dateString === targetDate) ||
          currentMonthItems[currentMonthItems.length - 1] ||
          list[0];

        if (initialSelected) {
          onSelectDevotional(initialSelected);
        }
      } catch (err) {
        console.error("Error loading devotionals:", err);
      }
    }

    loadInitialMonth();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Previous Month dynamically on scroll to left edge
  const loadPreviousMonth = useCallback(() => {
    if (isLoadingPreviousMonth || !hasMorePastMonths || loadedMonths.length === 0) return;

    setIsLoadingPreviousMonth(true);

    const oldestLoadedMonth = loadedMonths[0];
    const prevMonthKey = getPreviousMonthKey(oldestLoadedMonth);

    // Filter items for the previous month from cached API data
    const prevMonthItems = allApiDevotionals.filter(
      (d) => getMonthKey(d.dateString) === prevMonthKey
    );

    setTimeout(() => {
      if (prevMonthItems.length > 0) {
        const container = scrollContainerRef.current;
        const previousScrollWidth = container ? container.scrollWidth : 0;

        setLoadedDevotionals((prev) => [...prevMonthItems, ...prev]);
        setLoadedMonths((prev) => [prevMonthKey, ...prev]);

        // Maintain relative scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            const newScrollWidth = container.scrollWidth;
            container.scrollLeft += newScrollWidth - previousScrollWidth;
          }
        });
      } else {
        setHasMorePastMonths(false);
      }
      setIsLoadingPreviousMonth(false);
    }, 400);
  }, [isLoadingPreviousMonth, hasMorePastMonths, loadedMonths, allApiDevotionals]);

  // 3. Horizontal Scroll Observer: Detect Left Edge & Update Header Month Name
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Trigger load when scrolled near left edge (scrollLeft < 40px)
    if (container.scrollLeft < 40) {
      loadPreviousMonth();
    }

    // Determine visible month header dynamically based on scroll position
    const children = Array.from(container.children) as HTMLElement[];
    for (const child of children) {
      const rect = child.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Find the element closest to the horizontal center of container
      if (rect.left >= containerRect.left && rect.left <= containerRect.right) {
        const dateAttr = child.getAttribute("data-date");
        if (dateAttr) {
          setVisibleMonthName(formatMonthHeader(dateAttr));
          break;
        }
      }
    }
  };

  // Auto-scroll active item into view on load or date change
  useEffect(() => {
    if (currentDateString && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector(
        `[data-date="${currentDateString}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [currentDateString, loadedDevotionals.length]);

  const isFutureDate = (dateStr: string) => dateStr > todayStr;
  const getDayLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" });
  const getDayNumber = (dateStr: string) => dateStr.split("-")[2];

  return (
    <div className="w-full mb-4 relative z-50">
      {/* Month Year Header Label */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-500 bg-red-950/40 border border-red-900/40 px-3 py-1 rounded-full">
          {visibleMonthName || "Current Month"}
        </span>
        <span className="text-[10px] font-mono text-neutral-500 uppercase">
          Daily Bread
        </span>
      </div>

      {/* Horizontal Calendar Strip */}
      <div className="relative flex items-center">
        {/* Preloader Spinner when scrolling back to past months */}
        {isLoadingPreviousMonth && (
          <div className="shrink-0 mr-2 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900/80 border border-neutral-800">
            <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 snap-x scroll-smooth"
        >
          {loadedDevotionals.map((item) => {
            const isSelected = item.dateString === currentDateString;
            const isFuture = isFutureDate(item.dateString);

            return (
              <button
                key={item.dateString}
                data-date={item.dateString}
                disabled={isFuture}
                onClick={() => {
                  onSelectDevotional(item);
                  router.push(`/devotional/${item.dateString}`);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 300);
                }}
                className={`flex flex-col cursor-pointer items-center shrink-0 w-14 snap-center rounded-2xl border transition-all duration-300 group ${
                  isFuture ? "opacity-20 border-transparent pointer-events-none" : ""
                } ${
                  isSelected
                    ? "bg-[#ff0000] border-white/30 text-white shadow-[0_0_20px_rgba(255,0,0,0.4)] scale-105"
                    : "bg-neutral-900/60 border-neutral-800/60 text-neutral-400 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider pt-2.5 pb-1 block transition-colors ${
                    isSelected ? "text-white" : "text-neutral-500 group-hover:text-neutral-400"
                  }`}
                >
                  {getDayLabel(item.dateString)}
                </span>

                <div
                  className={`w-full text-center bg-black/30 rounded-t-xl font-bold text-base pb-3 pt-0.5 ${
                    isSelected ? "text-white" : "text-neutral-200"
                  }`}
                >
                  {getDayNumber(item.dateString)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
