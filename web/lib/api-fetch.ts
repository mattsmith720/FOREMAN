import { getApiUrl } from "./api-url";
import { withRetry } from "./retry";
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
  init: RequestInit & { retry?: { retries?: number; allowUnsafe?: boolean } } = {},
): Promise<Response> {
  const { retry, ...fetchInit } = init;
  const headers = getApiHeaders(
    fetchInit.headers instanceof Headers
      ? Object.fromEntries(fetchInit.headers.entries())
      : (fetchInit.headers as Record<string, string> | undefined),
  );
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const isIdempotentMethod =
    method === "GET" || method === "HEAD" || method === "OPTIONS";
  const shouldRetryRequest = retry
    ? (retry.allowUnsafe || isIdempotentMethod) &&
      (retry.retries ?? 1) > 0
    : isIdempotentMethod;

  const doFetch = () =>
    fetch(`${getApiUrl()}${path}`, {
      ...fetchInit,
      headers,
    });

  if (!shouldRetryRequest) {
    return doFetch();
  }

  return withRetry(doFetch, {
    retries: retry?.retries ?? 1,
    signal: fetchInit.signal ?? undefined,
    shouldRetryResult: (response) => response.status >= 500,
    shouldRetryError: (error) => {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }
      return true;
    },
  });
}
