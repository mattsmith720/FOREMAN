export const SAME_ORIGIN_API_BASE = "/api";

export function getApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured || configured === "same-origin") {
    return SAME_ORIGIN_API_BASE;
  }

  if (configured.startsWith("/")) {
    return configured.replace(/\/$/, "") || SAME_ORIGIN_API_BASE;
  }

  return SAME_ORIGIN_API_BASE;
}
