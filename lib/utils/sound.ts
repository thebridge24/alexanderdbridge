/**
 * Audio helpers for Bridge Devotional sounds:
 * - notification-ring: /notification-ring.mp3 (Triggered on likes, replies, comments, general alerts)
 * - alarm-beep: /alarm-beep.mp3 (Triggered on devotional alarm reminder & alarm time checks)
 */

let notificationAudio: HTMLAudioElement | null = null;
let alarmAudio: HTMLAudioElement | null = null;

/**
 * Preloads audio assets into memory to ensure zero-latency playback on notification events.
 */
export function preloadAudioAssets(): void {
  if (typeof window === "undefined") return;

  try {
    if (!notificationAudio) {
      notificationAudio = new Audio("/notification-ring.mp3");
      notificationAudio.preload = "auto";
    }
    if (!alarmAudio) {
      alarmAudio = new Audio("/alarm-beep.mp3");
      alarmAudio.preload = "auto";
    }
  } catch (err) {
    // Non-critical: Audio preloading silently skipped in environments without HTML5 Audio
    console.debug("Audio assets preloading not supported in current environment:", err);
  }
}

/**
 * Plays the notification ring tone for comments, replies, and general notifications.
 */
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;

  try {
    if (!notificationAudio) {
      notificationAudio = new Audio("/notification-ring.mp3");
      notificationAudio.preload = "auto";
    } else {
      notificationAudio.currentTime = 0;
    }
    notificationAudio.volume = 0.75;
    const playPromise = notificationAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be blocked if user has not interacted with document yet
        console.warn("Notification sound autoplay blocked or not allowed yet:", err);
      });
    }
  } catch (err) {
    console.warn("Failed to play notification ring sound:", err);
  }
}

/**
 * Plays the alarm beep tone for morning devotional alarms and reminders.
 */
export function playAlarmSound(): void {
  if (typeof window === "undefined") return;

  try {
    if (!alarmAudio) {
      alarmAudio = new Audio("/alarm-beep.mp3");
      alarmAudio.preload = "auto";
    } else {
      alarmAudio.currentTime = 0;
    }
    alarmAudio.volume = 0.85;
    const playPromise = alarmAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay may be blocked if user has not interacted with document yet
        console.warn("Alarm beep sound autoplay blocked or not allowed yet:", err);
      });
    }
  } catch (err) {
    console.warn("Failed to play alarm beep sound:", err);
  }
}

/**
 * Volume levels and audio state preferences.
 */
let soundEnabled = true;

/**
 * Checks if sound playback is enabled.
 */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("bridge_sound_enabled");
  if (stored !== null) {
    soundEnabled = stored === "true";
  }
  return soundEnabled;
}

/**
 * Toggles or sets sound playback permission in localStorage.
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("bridge_sound_enabled", String(enabled));
  }
}

/**
 * Stops any actively ringing alarm beep sound.
 */
export function stopAlarmSound(): void {
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }
}


