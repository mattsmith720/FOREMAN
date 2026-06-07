// Per-device worker profile so repeat opens are (near) zero-tap: we remember
// consent, the last job phase, and the worker's name in localStorage.

const KEY = "foreman_worker_profile";
export const CONSENT_VERSION = 1;

export interface WorkerProfile {
  workerName?: string;
  accreditationNumber?: string;
  crewName?: string;
  orgName?: string;
  lastPhase?: string;
  consentAt?: string;
  consentVersion?: number;
}

export function loadWorkerProfile(): WorkerProfile {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkerProfile) : {};
  } catch {
    return {};
  }
}

export function saveWorkerProfile(patch: WorkerProfile): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const next: WorkerProfile = { ...loadWorkerProfile(), ...patch };
    if (patch.consentAt && patch.consentVersion === undefined) {
      next.consentVersion = CONSENT_VERSION;
    }
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage disabled — non-fatal, we just don't remember.
  }
}

export function hasValidConsent(profile: WorkerProfile): boolean {
  return Boolean(
    profile.consentAt && profile.consentVersion === CONSENT_VERSION,
  );
}
