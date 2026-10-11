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

  return (
    <html lang="en">
      <body className="bg-black text-white">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-neutral-400">Something went wrong loading this page.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
