export interface GeoFix {
  lat: number;
  lng: number;
  accuracyM: number | null;
  capturedAt: string;
}

/** Best-effort fix for CER geotagged evidence (folded into job-start gesture). */
export function captureGeoFix(): Promise<GeoFix | null> {
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
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}
