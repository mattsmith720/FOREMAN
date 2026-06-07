import {
  createProxyErrorResponse,
  proxyBinaryToBackend,
} from "../../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyBinaryToBackend(`/sessions/${params.id}/evidence-pack`, request, {
      timeoutMs: 55_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy evidence pack request");
  }
}
