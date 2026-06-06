import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/sessions/start", request, {
      timeoutMs: 15_000,
      maxBodyBytes: 200_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy session start request");
  }
}
