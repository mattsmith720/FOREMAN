import { getApiUrl } from "./api-url";
import { getSessionAuthHeaders } from "./session-auth";

export function getApiHeaders(
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    ...getSessionAuthHeaders(),
    ...extra,
  };
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
