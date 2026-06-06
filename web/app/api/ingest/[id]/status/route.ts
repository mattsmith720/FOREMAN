import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 15;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return await proxyToBackend(
      `/ingest/videos/${id}`,
      new Request(_request.url, { method: "GET" }),
      { timeoutMs: 12_000 },
    );
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to load video status");
  }
}
