import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/metrics/cue-e2e", request, {
      timeoutMs: 5_000,
      maxBodyBytes: 256,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy cue latency metric");
  }
}
