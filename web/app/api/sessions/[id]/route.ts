import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}`, request, {
      timeoutMs: 10_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy session request");
  }
}
