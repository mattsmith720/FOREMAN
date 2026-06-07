import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 18;

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/labels/confirm", request, {
      timeoutMs: 12_000,
      maxBodyBytes: 50_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy label confirm request");
  }
}
