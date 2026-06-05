import { getApiUrl } from "./api-url";

const API_KEY_HEADER = "x-foreman-api-key";

export function getApiHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };

  const apiKey = process.env.NEXT_PUBLIC_FOREMAN_API_KEY?.trim();
  if (apiKey) {
    headers[API_KEY_HEADER] = apiKey;
  }

  return headers;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = getApiHeaders(
    init.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : (init.headers as Record<string, string> | undefined),
  );

  return fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers,
  });
}
