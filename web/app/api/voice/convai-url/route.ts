import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/voice/convai-url", request, {
      timeoutMs: 10_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy ConvAI URL request");
  }
}
