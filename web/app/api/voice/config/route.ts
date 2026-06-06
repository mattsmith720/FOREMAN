import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/voice/config", request, {
      timeoutMs: 10_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice config request");
  }
}
