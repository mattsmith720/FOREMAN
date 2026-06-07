import { createProxyErrorResponse, proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return await proxyToBackend(`/sessions/${params.id}/training-module`, request, {
      timeoutMs: 55_000,
    });
  } catch (error) {
    return createProxyErrorResponse(
      error,
      "Failed to proxy training module request",
    );
  }
}
