import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the OAuth redirect URL using public environment variables.
 * Prioritizes configured NEXT_PUBLIC_URL, NEXT_PUBLIC_SITE_URL, or NEXT_PUBLIC_APP_URL.
 * Handles local development gracefully when running on localhost.
 */
export function getAuthRedirectUrl(path?: string): string {
  // 1. In browser, if running locally, use localhost to avoid redirecting to production during dev
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const base = window.location.origin;
      return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base;
    }
  }

  // 2. Target public URL environment variable
  const configured =
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  let baseUrl = configured ? configured.replace(/\/$/, "") : "";

  // 3. Fallback to window origin in browser
  if (!baseUrl && typeof window !== "undefined" && window.location.origin) {
    baseUrl = window.location.origin;
  }

  // 4. Default fallback domain
  if (!baseUrl) {
    baseUrl = "https://alexanderdbridge.com";
  }

  if (path) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  return baseUrl;
}

const POST_LOGIN_REDIRECT_KEY = "bridge_post_login_redirect";
const POST_LOGIN_REDIRECT_TTL_MS = 15 * 60 * 1000;

/**
 * Returns the path only if it is a same-site relative path (e.g. "/devotional/2026-10-07").
 * Rejects absolute URLs and protocol-relative paths ("//evil.com", "/\evil.com") to prevent open redirects.
 */
export function getSafeRedirectPath(raw?: string | null): string | null {
  if (!raw) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return null;
  }
  return path;
}

/** Reads `?redirectto=` (or `?redirectTo=`) from the current browser URL. */
function getRedirectParamFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return getSafeRedirectPath(params.get("redirectto") ?? params.get("redirectTo"));
}

/**
 * Decides where the user should land after signing in:
 * explicit path > `?redirectto=` in the URL > the page they are currently on.
 */
function resolveRedirectPath(explicitPath?: string): string | null {
  const fromArg = getSafeRedirectPath(explicitPath);
  if (fromArg) return fromArg;

  const fromParam = getRedirectParamFromLocation();
  if (fromParam) return fromParam;

  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    return window.location.pathname + window.location.search;
  }
  return null;
}

/**
 * Returns (and clears) the path the user should be sent to after login, if any.
 * Checks `?redirectto=` in the URL first, then the path saved before the Google redirect.
 */
export function consumePostLoginRedirect(): string | null {
  const fromParam = getRedirectParamFromLocation();

  let stored: string | null = null;
  try {
    const raw = localStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    if (raw) {
      const { path, savedAt } = JSON.parse(raw) as { path?: string; savedAt?: number };
      if (savedAt && Date.now() - savedAt < POST_LOGIN_REDIRECT_TTL_MS) {
        stored = getSafeRedirectPath(path);
      }
    }
  } catch {
    // Storage unavailable or malformed — ignore
  }

  return fromParam ?? stored;
}

/**
 * Starts Google sign-in and returns the user to `redirectPath` afterwards
 * (defaults to `?redirectto=` in the URL, or the current page).
 */
export async function signInWithGoogle(
  supabase: SupabaseClient,
  redirectPath?: string,
): Promise<void> {
  const target = resolveRedirectPath(redirectPath);

  if (target) {
    // Fallback in case Supabase ignores redirectTo and sends the user to the Site URL instead
    try {
      localStorage.setItem(
        POST_LOGIN_REDIRECT_KEY,
        JSON.stringify({ path: target, savedAt: Date.now() }),
      );
    } catch {
      // Storage unavailable — the callback `next` param still carries the target
    }
  }

  const callbackPath = target
    ? `/auth/callback?next=${encodeURIComponent(target)}`
    : "/auth/callback";

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: getAuthRedirectUrl(callbackPath) },
  });
}
