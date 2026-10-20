/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack } from "react-icons/io5";
import { FiCheck, FiTrash, FiPlus, FiEye, FiEdit3 } from "react-icons/fi";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import DevotionalArticle from "../../../components/DevotionalArticle"; 
import { formatDate } from "@/lib/format-date";

export default function DevotionalEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form States
  const [dateString, setDateString] = useState(dateParam);
  const [dayNumber, setDayNumber] = useState("1");
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

  // Fetch devotional if editing existing date, or pre-populate sequential day number
  useEffect(() => {
    async function loadDevotionalData() {
      try {
        setFetching(true);
        const res = await fetch(`/api/devotionals/${encodeURIComponent(dateParam)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.devotional) {
            const d = data.devotional;
            setDayNumber(String(d.dayNumber || 1));
            setTopic(d.topic || "");
            setText(d.text || "");
            setMemoryVerse(d.memoryVerse || { verse: "", reference: "" });
            setExplanation(d.explanation || "");
            setNeededSteps(Array.isArray(d.neededSteps) && d.neededSteps.length ? d.neededSteps : [""]);
            setPrayerPoints(Array.isArray(d.prayerPoints) && d.prayerPoints.length ? d.prayerPoints : [""]);
          }
        } else {
          // If not found, fetch latest to calculate next day number
          const listRes = await fetch("/api/devotionals");
          if (listRes.ok) {
            const listData = await listRes.json();
            if (listData.devotionals && listData.devotionals.length > 0) {
              const latest = listData.devotionals[listData.devotionals.length - 1];
              if (latest.dayNumber) {
                setDayNumber(String(latest.dayNumber + 1));
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading devotional:", err);
      } finally {
        setFetching(false);
      }
    }

    loadDevotionalData();
  }, [dateParam]);

  const handleAddStep = () => setNeededSteps([...neededSteps, ""]);
  const handleStepChange = (index: number, val: string) => {
    const updated = [...neededSteps];
    updated[index] = val;
    setNeededSteps(updated);
  };
  const handleRemoveStep = (index: number) => {
    if (neededSteps.length > 1) setNeededSteps(neededSteps.filter((_, i) => i !== index));
  };

  const handleAddPrayer = () => setPrayerPoints([...prayerPoints, ""]);
  const handlePrayerChange = (index: number, val: string) => {
    const updated = [...prayerPoints];
    updated[index] = val;
    setPrayerPoints(updated);
  };
  const handleRemovePrayer = (index: number) => {
    if (prayerPoints.length > 1) setPrayerPoints(prayerPoints.filter((_, i) => i !== index));
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
      neededSteps: neededSteps.filter((s) => s.trim() !== ""),
      prayerPoints: prayerPoints.filter((p) => p.trim() !== ""),
    };

    try {
      const response = await fetch(`/api/devotionals/${encodeURIComponent(dateString)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If PUT fails because it doesn't exist yet, try POST
      let res = response;
      if (!response.ok) {
        res = await fetch("/api/devotionals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save devotional");

      setMessage({ type: "success", text: "Devotional saved and published successfully!" });
      setTimeout(() => router.push("/admin/devotionals"), 1200);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while saving." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-8 space-y-8">
      {/* Top Header & Switcher */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between pb-6 border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/devotionals"
            className="p-2.5 rounded-full bg-black border border-white/15 text-neutral-400 hover:text-white transition-colors"
          >
            <IoArrowBack className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Create New/Edit ({formatDate(dateString, { includeWeekday: true })})
            </h1>
            <p className="text-xs text-neutral-500">Day {dayNumber} • {displayDate}</p>
          </div>
        </div>

        {/* Edit / Preview Tabs */}
        <div className="flex items-center p-1 rounded-full bg-black border border-neutral-900 ">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`flex items-center flex-1 justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "edit"
                ? "bg-red-600 text-white shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FiEdit3 size={13} /> Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-red-600 text-white shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FiEye size={13} /> Preview
          </button>
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-4 rounded-2xl border text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                : "bg-red-950/20 border-red-800/40 text-red-400"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {fetching ? (
        <div className="py-24 text-center text-xs font-mono text-neutral-500">
          Loading devotional data...
        </div>
      ) : activeTab === "preview" ? (
        /* READER PREVIEW SUBPAGE VIEW */
        <div className="p-8 rounded-3xl bg-black border border-white/15">
          <DevotionalArticle
            devotional={{
              dateString,
              dayNumber: parseInt(dayNumber, 10) || 1,
              displayDate,
              topic: topic || "Untitled Devotional",
              text: text || "Scripture Reference",
              memoryVerse,
              explanation: explanation || "Devotional explanation body...",
              neededSteps,
              prayerPoints,
            }}
            monthTheme="Walking in Faith"
            viewsCount={142}
          />
        </div>
      ) : (
        /* EDIT FORM (Bottom-Border-Only Inputs & Auto-Growing Textareas) */
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:p-6 rounded-3xl bg-black md:border border-white/15">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Publish Date
              </label>
              <input
                type="date"
                required
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="w-full bg-transparent text-sm text-white pb-2 border-b border-white/15 focus:border-red-500 outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Day Number
              </label>
              <input
                type="number"
                required
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                className="w-full bg-transparent text-sm text-white pb-2 border-b border-white/15 focus:border-red-500 outline-none transition-colors font-mono"
              />
            </div>
          </div>

          <div className="md:p-6 rounded-3xl bg-black md:border border-white/15 space-y-6">
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
                className="w-full bg-transparent text-lg font-bold text-white pb-2 border-b border-white/15 focus:border-red-500 outline-none transition-colors"
              />
            </div>

            <div className="flex gap-4 w-full">
                <div className="w-full">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Scripture Reference
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John 17:3"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-transparent text-sm text-neutral-300 pb-2 border-b border-white/15 focus:border-red-500 outline-none transition-colors"
              />  
                </div>
            

               <div className="w-full">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Verse Reference
                </label>
                <input
                  type="text"
                  required
                  placeholder="John 17:3, KJV"
                  value={memoryVerse.reference}
                  onChange={(e) => setMemoryVerse({ ...memoryVerse, reference: e.target.value })}
                  className="w-full bg-transparent text-sm text-white pb-2 border-b border-white/15 focus:border-red-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Memory Verse Quote
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="“And this is life eternal...”"
                  value={memoryVerse.verse}
                  onChange={(e) => setMemoryVerse({ ...memoryVerse, verse: e.target.value })}
                  className="w-full text-sm text-neutral-200 p-4 border-b border-white/15 focus:border-red-500 outline-none transition-colors resize-y min-h-20"
                />
              </div>
             
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Devotional Body / Explanation
              </label>
              <textarea
                required
                rows={6}
                placeholder="Elaborate on the devotional message..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full bg-black/50 text-sm text-neutral-200 p-4 border-b border-white/15 focus:border-red-500 outline-none transition-colors resize-y min-h-40"
              />
            </div>
          </div>

          {/* Needed Steps & Prayer Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 ">
            <div className="md:p-6 rounded-3xl bg-black md:border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Needed Steps</h3>
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add Step
                </button>
              </div>
              <div className="space-y-3">
                {neededSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="font-mono text-xs font-bold text-neutral-500 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      placeholder="Step instruction..."
                      value={step}
                      onChange={(e) => handleStepChange(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white py-2 border-b border-white/15 focus:border-red-500 outline-none"
                    />
                    {neededSteps.length > 1 && (
                      <button type="button" onClick={() => handleRemoveStep(idx)} className="text-neutral-500 hover:text-red-500 p-1">
                        <FiTrash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:p-6 rounded-3xl bg-black md:border border-white/15 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Prayer Points</h3>
                <button
                  type="button"
                  onClick={handleAddPrayer}
                  className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1"
                >
                  <FiPlus size={12} /> Add Prayer
                </button>
              </div>
              <div className="space-y-3">
                {prayerPoints.map((prayer, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="font-mono text-xs font-bold text-neutral-500 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      placeholder="Prayer point..."
                      value={prayer}
                      onChange={(e) => handlePrayerChange(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-white py-2 border-b border-white/15 focus:border-red-500 outline-none"
                    />
                    {prayerPoints.length > 1 && (
                      <button type="button" onClick={() => handleRemovePrayer(idx)} className="text-neutral-500 hover:text-red-500 p-1">
                        <FiTrash size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 md:gap-4">
            <Link
              href="/admin/devotionals"
              className="px-6 py-3 rounded-full border border-white/15 bg-black text-xs font-bold text-neutral-300 hover:bg-black transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiCheck size={16} />
              {loading ? "Saving Devotional..." : "Publish Devotional"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}