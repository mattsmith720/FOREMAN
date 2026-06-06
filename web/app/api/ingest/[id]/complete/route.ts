import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 30;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return await proxyToBackend(
      `/ingest/videos/${id}/complete`,
      new Request(_request.url, { method: "POST" }),
      { timeoutMs: 25_000 },
    );
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to complete video upload");
  }
}
