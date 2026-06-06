let wakeLock: WakeLockSentinel | null = null;
let shouldHoldWakeLock = false;

export function setWakeLockDesired(active: boolean): void {
  shouldHoldWakeLock = active;
}

export async function requestWakeLock(): Promise<void> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return;
  }

  shouldHoldWakeLock = true;

  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    // Ignore — unsupported or denied
  }
}

export async function releaseWakeLock(): Promise<void> {
  shouldHoldWakeLock = false;

  if (!wakeLock) {
    return;
  }

  try {
    await wakeLock.release();
  } catch {
    // Ignore
  }

  wakeLock = null;
}

/** Re-acquire after iOS Safari tab becomes visible again. */
export async function refreshWakeLockIfNeeded(): Promise<void> {
  if (!shouldHoldWakeLock || typeof document === "undefined") {
    return;
  }

  if (document.visibilityState !== "visible") {
    return;
  }

  if (wakeLock) {
    return;
  }

  await requestWakeLock();
}
