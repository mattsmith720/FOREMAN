import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 20;

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/ops/ingest", request, { timeoutMs: 15_000 });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to load ingest queue");
  }
}
