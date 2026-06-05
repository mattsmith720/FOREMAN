let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {
    // Ignore — unsupported or denied
  }
}

export async function releaseWakeLock(): Promise<void> {
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
