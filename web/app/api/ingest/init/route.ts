import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    return await proxyToBackend("/ingest/videos/init", request, {
      timeoutMs: 25_000,
      maxBodyBytes: 100_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to init video upload");
  }
}
