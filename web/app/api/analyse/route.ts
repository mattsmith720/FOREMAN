import { createProxyErrorResponse, proxyToBackend } from "../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/analyse", request, {
      timeoutMs: 55_000,
      maxBodyBytes: 2_000_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy analyse request");
  }
}
