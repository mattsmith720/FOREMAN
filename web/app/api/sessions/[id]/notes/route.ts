import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}/notes`, request, {
      timeoutMs: 12_000,
      maxBodyBytes: 50_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy notes request");
  }
}
