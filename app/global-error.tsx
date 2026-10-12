"use client";

import { useEffect } from "react";

const RELOAD_KEY = "bridge_error_reloaded_at";
const RELOAD_COOLDOWN_MS = 30_000;

// Last-resort error screen. A stale tab after a new deploy ("Failed to find Server Action",
// missing chunks) is fixed by a fresh load, so reload once automatically instead of
// leaving the user on a dead "page couldn't load" screen.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    try {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      if (Date.now() - last > RELOAD_COOLDOWN_MS) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    } catch {
      // sessionStorage unavailable — fall through to the manual retry button
    }
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem("bridge_devotional_streak_v1");
      localStorage.removeItem("completed_devotionals");
      if ("caches" in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-neutral-400">Something went wrong loading this page.</p>
          {error?.message && (
            <p className="text-xs text-red-400 max-w-md font-mono bg-red-950/40 p-2.5 rounded-lg border border-red-900/60 break-words">
              {error.message}
            </p>
          )}
          {error?.digest && (
            <p className="text-[10px] text-neutral-500 font-mono">Digest: {error.digest}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => (reset ? reset() : window.location.reload())}
              className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-neutral-200 active:scale-95 transition-all"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={handleClearCacheAndReload}
              className="rounded-full border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 active:scale-95 transition-all"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
