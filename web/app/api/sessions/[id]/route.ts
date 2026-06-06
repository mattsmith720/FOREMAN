import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await proxyToBackend(`/sessions/${id}`, request, {
      timeoutMs: 10_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy session request");
  }
}
