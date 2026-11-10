/** Short vibration for a tap. Does nothing on devices or browsers without vibration. */
export function haptic(pattern: number | number[] = 12): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Some browsers block vibration until the user has interacted; ignore */
  }
}
