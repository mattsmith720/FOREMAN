import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

// Tolerate a Render cold start on the first job after an idle period.
export const maxDuration = 25;

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/sessions/start", request, {
      timeoutMs: 20_000,
      maxBodyBytes: 200_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy session start request");
  }
}
