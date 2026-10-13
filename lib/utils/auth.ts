import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the canonical base URL for server route handlers.
 * Inspects reverse proxy headers (x-forwarded-proto, x-forwarded-host) first,
 * then host header, then public env vars, and finally falls back to https://alexanderdbridge.com.
 * Strictly prevents redirecting to localhost in production.
 */
export function getServerBaseUrl(request?: Request | { headers: Headers }): string {
  if (request) {
    const headers = "headers" in request ? request.headers : undefined;
    if (headers) {
      const forwardedHost = headers.get("x-forwarded-host");
      const host = forwardedHost || headers.get("host");
      const proto =
        headers.get("x-forwarded-proto") ||
        (host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https");

      if (host) {
        // Only allow localhost if we are explicitly not in production
        const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1");
        if (!isLocalHost) {
          return `${proto}://${host}`.replace(/\/$/, "");
        }
        if (process.env.NODE_ENV !== "production") {
          return `${proto}://${host}`.replace(/\/$/, "");
        }
      }
    }
  }

  const configured =
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  let baseUrl = configured ? configured.replace(/\/$/, "") : "";
  if ((baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) && process.env.NODE_ENV === "production") {
    baseUrl = "";
  }

  return baseUrl || "https://alexanderdbridge.com";
}

/**
 * Resolves the OAuth redirect URL.
 * - In browser: ALWAYS uses the active window.location.origin so the user stays on their current origin.
 * - On server: Inspects request headers or falls back to canonical https://alexanderdbridge.com.
 */
export function getAuthRedirectUrl(path?: string, request?: Request | { headers: Headers }): string {
  let baseUrl = "";

  // 1. In browser, ALWAYS use the active window.location.origin
  if (typeof window !== "undefined" && window.location?.origin) {
    baseUrl = window.location.origin.replace(/\/$/, "");
  } else {
    // 2. On server, resolve dynamically from request or production canonical fallback
    baseUrl = getServerBaseUrl(request);
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
