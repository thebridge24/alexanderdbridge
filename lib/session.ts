const SESSION_STORAGE_KEY = "devotional_session_id";
const USER_NAME_STORAGE_KEY = "devotional_user_name";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = createSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function getStoredUserName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(USER_NAME_STORAGE_KEY) ?? "";
}

export function storeUserName(name: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_NAME_STORAGE_KEY, name.trim());
}
