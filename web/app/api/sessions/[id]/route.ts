import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 15;

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
