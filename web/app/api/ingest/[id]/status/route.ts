import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 15;

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    return await proxyToBackend(
      `/ingest/videos/${context.params.id}`,
      new Request(_request.url, { method: "GET" }),
      { timeoutMs: 12_000 },
    );
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to load video status");
  }
}
