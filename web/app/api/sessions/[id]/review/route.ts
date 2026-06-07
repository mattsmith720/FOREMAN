import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}/review`, request, {
      timeoutMs: 12_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy review request");
  }
}
