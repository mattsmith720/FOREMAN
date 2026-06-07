import { createProxyErrorResponse, proxyToBackend } from "../../../lib/proxy-backend";

// Render free-tier can cold-start for ~15-30s; tolerate it so the first hit
// after idle returns a slow 200 instead of a 504 that reads like an outage.
export const maxDuration = 25;

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/health", request, {
      timeoutMs: 22_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy health request");
  }
}
