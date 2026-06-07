import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 15;

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/voice/convai-url", request, {
      timeoutMs: 10_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy ConvAI URL request");
  }
}
