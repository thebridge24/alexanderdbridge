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
