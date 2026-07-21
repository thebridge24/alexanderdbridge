/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoLockClosed } from "react-icons/io5";
import { FaCheck, FaTrash, FaPlus, FaSignOutAlt, FaBookOpen } from "react-icons/fa";
import Link from "next/link";

const CORRECT_PIN = "1234";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Devotional form state
  const [dateString, setDateString] = useState("");
  const [dayNumber, setDayNumber] = useState("");
  const [displayDate, setDisplayDate] = useState("");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [memoryVerse, setMemoryVerse] = useState({ verse: "", reference: "" });
  const [explanation, setExplanation] = useState("");
  const [neededSteps, setNeededSteps] = useState<string[]>([""]);
  const [prayerPoints, setPrayerPoints] = useState<string[]>([""]);

  // Auto-generate display date when dateString changes
  useEffect(() => {
    if (dateString) {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const dateObj = new Date(year, month, day);
        if (!isNaN(dateObj.getTime())) {
          const formatted = dateObj.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });
          setDisplayDate(formatted);
        }
      }
    }
  }, [dateString]);

  // Set default date to today
  useEffect(() => {
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    setDateString(formatted);
    
    // Check if already authenticated in session storage
    if (typeof window !== "undefined") {
      const auth = window.sessionStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Pre-populate day number and date string with the next sequential values
  useEffect(() => {
    async function loadLatestDevotional() {
      try {
        const res = await fetch("/api/devotionals");
        if (res.ok) {
          const data = await res.json();
          if (data.devotionals && data.devotionals.length > 0) {
            const latest = data.devotionals[data.devotionals.length - 1];
            if (latest.dayNumber) {
              setDayNumber(String(latest.dayNumber + 1));
            }
            if (latest.dateString) {
              const parts = latest.dateString.split("-");
              const nextDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1);
              if (!isNaN(nextDate.getTime())) {
                const formatted = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
                setDateString(formatted);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading latest devotional for pre-population:", err);
      }
    }

    if (isAuthenticated) {
      loadLatestDevotional();
    }
  }, [isAuthenticated]);

  // Handle PIN entry validation
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setTimeout(() => {
          setIsAuthenticated(true);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("admin_auth", "true");
          }
          setPin("");
        }, 200);
      } else {
        setIsError(true);
        setTimeout(() => {
          setPin("");
          setIsError(false);
        }, 1000);
      }
    }
  }, [pin]);

  const handleKeyPress = (key: string) => {
    if (pin.length === 4 || isError) return;
    setPin((prev) => prev + key);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("admin_auth");
    }
  };

  // Needed Steps actions
  const handleAddStep = () => {
    setNeededSteps([...neededSteps, ""]);
  };

  const handleStepChange = (index: number, value: string) => {
    const updated = [...neededSteps];
    updated[index] = value;
    setNeededSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    if (neededSteps.length > 1) {
      setNeededSteps(neededSteps.filter((_, i) => i !== index));
    }
  };

  // Prayer Points actions
  const handleAddPrayer = () => {
    setPrayerPoints([...prayerPoints, ""]);
  };

  const handlePrayerChange = (index: number, value: string) => {
    const updated = [...prayerPoints];
    updated[index] = value;
    setPrayerPoints(updated);
  };

  const handleRemovePrayer = (index: number) => {
    if (prayerPoints.length > 1) {
      setPrayerPoints(prayerPoints.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      dateString,
      dayNumber,
      displayDate,
      topic,
      text,
      memoryVerse,
      explanation,
      neededSteps: neededSteps.filter(s => s.trim() !== ""),
      prayerPoints: prayerPoints.filter(p => p.trim() !== ""),
    };

    try {
      const response = await fetch("/api/devotionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save devotional");
      }

      setMessage({ type: "success", text: "Devotional saved successfully!" });
      
      // Reset form fields except date (increment dayNumber)
      setTopic("");
      setText("");
      setMemoryVerse({ verse: "", reference: "" });
      setExplanation("");
      setNeededSteps([""]);
      setPrayerPoints([""]);
      if (dayNumber) {
        setDayNumber(String(parseInt(dayNumber, 10) + 1));
      }
      
      // Auto advance date by 1 day
      if (dateString) {
        const parts = dateString.split("-");
        const nextDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1);
        const formatted = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;
        setDateString(formatted);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-black text-white selection:bg-neutral-800 relative flex flex-col items-center">
      {/* Background Neon Glows */}
      <div className="absolute top-0 left-1/4 w-125 h-125 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-125 h-125 bg-neutral-900/40 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          /* PASSCODE INTERFACE */
          <motion.div
            key="passcode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full min-h-screen flex flex-col items-center justify-center px-6 z-10"
          >
            <div className="mb-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-red-500 mb-4 shadow-xl">
                <IoLockClosed className="size-6 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold tracking-widest uppercase text-neutral-300">
                Admin Gateway
              </h2>
              <p className="text-xs text-neutral-500 mt-2">
                Enter PIN code to manage devotionals
              </p>
            </div>

            {/* PIN DOTS WITH SHAKE ANIMATION */}
            <motion.div
              animate={{ x: isError ? [-12, 12, -8, 8, -4, 4, 0] : 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-4 mb-10"
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border transition-all duration-200
                  ${pin.length > i 
                    ? "bg-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-110" 
                    : "border-neutral-700 bg-neutral-950"
                  }
                  ${isError ? "border-red-600 bg-red-950/20" : ""}`}
                />
              ))}
            </motion.div>

            {/* KEYPAD GRID */}
            <div className="grid grid-cols-3 gap-5 w-70">
              {KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className="w-20 h-20 rounded-full text-2xl font-bold bg-neutral-900/60 border border-neutral-800/80 active:bg-neutral-800 hover:border-neutral-700 active:scale-90 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-lg"
                >
                  {key}
                </button>
              ))}

              {/* CANCEL/BACK BUTTON */}
              <Link
                href="/devotional"
                className="w-20 h-20 rounded-full text-sm font-semibold text-neutral-500 hover:text-neutral-300 transition-colors flex items-center justify-center cursor-pointer"
              >
                Cancel
              </Link>

              {/* BACKSPACE BUTTON */}
              <button
                onClick={handleBackspace}
                className="col-start-3 w-20 h-20 rounded-full active:scale-95 transition-all text-neutral-400 active:text-white flex items-center justify-center cursor-pointer hover:border-neutral-700 border border-transparent"
                aria-label="Delete last digit"
              >
                <svg
                  className="size-8"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path d="m 7 2 c -0.832031 0 -1.558594 0.34375 -2.292969 0.78125 s -1.464843 1.003906 -2.128906 1.597656 c -0.660156 0.597656 -1.253906 1.222656 -1.707031 1.796875 c -0.226563 0.289063 -0.417969 0.5625 -0.570313 0.835938 c -0.152343 0.277343 -0.300781 0.53125 -0.300781 0.988281 s 0.148438 0.710938 0.300781 0.984375 c 0.152344 0.277344 0.34375 0.550781 0.570313 0.835937 c 0.453125 0.578126 1.046875 1.203126 1.707031 1.796876 c 0.664063 0.597656 1.394531 1.164062 2.128906 1.601562 s 1.460938 0.78125 2.292969 0.78125 h 6 c 1.644531 0 3 -1.355469 3 -3 v -6 c 0 -1.644531 -1.355469 -3 -3 -3 z m 1 3 c 0.265625 0 0.519531 0.105469 0.707031 0.292969 l 1.292969 1.292969 l 1.292969 -1.292969 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 s 0.519531 0.105469 0.707031 0.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 l -1.292969 1.292969 l 1.292969 1.292969 c 0.390625 0.390625 0.390625 1.023437 0 1.414062 s -1.023437 0.390625 -1.414062 0 l -1.292969 -1.292969 l -1.292969 1.292969 c -0.390625 0.390625 -1.023437 0.390625 -1.414062 0 s -0.390625 -1.023437 0 -1.414062 l 1.292969 -1.292969 l -1.292969 -1.292969 c -0.390625 -0.390625 -0.390625 -1.023437 0 -1.414062 c 0.1875 -0.1875 0.441406 -0.292969 0.707031 -0.292969 z m 0 0" fill="currentColor" />
                </svg>
              </button>
            </div>
          </motion.div>
        ) : (
          /* FORM INTERFACE */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl px-6 py-12 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-900">
              <div className="flex items-center gap-3">
                <Link
                  href="/devotional"
                  className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  aria-label="Back to devotionals"
                >
                  <IoArrowBack className="size-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-neutral-100 flex items-center gap-2">
                    <FaBookOpen className="text-red-500 size-5" /> Devotional Admin
                  </h1>
                  <p className="text-xs text-neutral-500">Publish new devotionals to the application</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-800 bg-neutral-950 text-xs font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
              >
                <FaSignOutAlt className="size-3" /> Lock Portal
              </button>
            </div>

            {/* Notification Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-4 mb-6 rounded-2xl border text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-950/20 border-green-800/40 text-green-400"
                      : "bg-red-950/20 border-red-800/40 text-red-400"
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Devotional Creation Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Date & Day Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Publish Date
                  </label>
                  <input
                    type="date"
                    required
                    value={dateString}
                    onChange={(e) => setDateString(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Day Number
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 194"
                    value={dayNumber}
                    onChange={(e) => setDayNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Auto display date feedback */}
              {displayDate && (
                <div className="text-xs text-neutral-500 bg-neutral-950/50 px-4 py-2 rounded-lg border border-neutral-900/60">
                  <span className="font-semibold">Generated Display Date:</span> {displayDate}
                </div>
              )}

              {/* Topic & Scripture Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Topic / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Knowing God Personally"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Scripture Reference
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John 17:3"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Memory Verse Block */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-850 space-y-4">
                <h3 className="text-sm font-bold tracking-wider text-neutral-400 uppercase">
                  Memory Verse
                </h3>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Verse Quote Text
                  </label>
                  <textarea
                    required
                    placeholder="“And this is life eternal, that they might know thee...”"
                    value={memoryVerse.verse}
                    onChange={(e) => setMemoryVerse({ ...memoryVerse, verse: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                    Verse Reference
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John 17:3, KJV"
                    value={memoryVerse.reference}
                    onChange={(e) => setMemoryVerse({ ...memoryVerse, reference: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Explanation Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Devotional Body / Explanation
                </label>
                <textarea
                  required
                  placeholder="Provide the core content and elaboration of the devotional..."
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                />
              </div>

              {/* Needed Steps (Dynamic Inputs) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Needed Steps
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <FaPlus className="size-2.5" /> Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {neededSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="font-mono text-xs font-bold text-neutral-500 h-10 w-10 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Spend 15 minutes in quiet prayer today."
                        value={step}
                        onChange={(e) => handleStepChange(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                      />
                      {neededSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-3 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Remove step"
                        >
                          <FaTrash className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prayer Points (Dynamic Inputs) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Prayer Points
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPrayer}
                    className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <FaPlus className="size-2.5" /> Add Prayer
                  </button>
                </div>

                <div className="space-y-3">
                  {prayerPoints.map((prayer, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="font-mono text-xs font-bold text-neutral-500 h-10 w-10 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lord, grant me the grace to wait on your timing."
                        value={prayer}
                        onChange={(e) => handlePrayerChange(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-red-500/50 transition-colors"
                      />
                      {prayerPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePrayer(idx)}
                          className="p-3 text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Remove prayer point"
                        >
                          <FaTrash className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Action Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm tracking-widest uppercase transition-all duration-300 disabled:bg-neutral-800 disabled:text-neutral-500 active:scale-[0.98] shadow-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    "Publishing Devotional..."
                  ) : (
                    <>
                      <FaCheck className="size-4" /> Publish Devotional
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
