import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

// Fetched on load; tolerate a Render cold start.
export const maxDuration = 22;

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/voice/config", request, {
      timeoutMs: 18_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice config request");
  }
}
