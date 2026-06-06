import { createProxyErrorResponse, proxyToBackend } from "../../../../../../lib/proxy-backend";

export const maxDuration = 25;

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    return await proxyToBackend(
      `/ops/sessions/${context.params.id}/export`,
      request,
      { timeoutMs: 20_000 },
    );
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to export session");
  }
}
