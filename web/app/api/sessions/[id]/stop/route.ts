import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}/stop`, request, {
      timeoutMs: 15_000,
      maxBodyBytes: 50_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy session stop request");
  }
}
