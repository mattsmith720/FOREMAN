import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}/evidence-pack`, request, {
      timeoutMs: 55_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy evidence pack request");
  }
}
