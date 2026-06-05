export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!url || url === "same-origin") {
    return "/api";
  }

  return url.replace(/\/$/, "");
}
