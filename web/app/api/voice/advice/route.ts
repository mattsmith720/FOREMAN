import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/voice/advice", request, {
      timeoutMs: 55_000,
      maxBodyBytes: 500_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice advice request");
  }
}
