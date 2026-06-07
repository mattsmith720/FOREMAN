export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
  capturedAt: string;
}

export const GEO_EVIDENCE_TIMEOUT_MS = 12_000;

/** Best-effort fix for CER geotagged evidence (folded into job-start gesture). */
export function captureGeoFix(): Promise<GeoFix | null> {
  return readGeoFix(GEO_EVIDENCE_TIMEOUT_MS);
}

/**
 * Await a fix inside the Start-tap gesture window before first stamped capture.
 * Integrator should call from camera-coach beginJob; Permissions-Policy is integrator-owned.
 */
export function awaitGeoForEvidence(
  timeoutMs = GEO_EVIDENCE_TIMEOUT_MS,
): Promise<GeoFix | null> {
  return readGeoFix(timeoutMs);
}

export function geoDeniedVoiceLine(): {
  text: string;
  severity: "warning";
} {
  return {
    text: "Location off — evidence may need manual geotag.",
    severity: "warning",
  };
}

function readGeoFix(timeoutMs: number): Promise<GeoFix | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy ?? null,
          capturedAt: new Date().toISOString(),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
}
