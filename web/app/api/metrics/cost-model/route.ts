import { createProxyErrorResponse, proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(request: Request) {
  try {
    return await proxyToBackend("/metrics/cost-model", request, { timeoutMs: 5_000 });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy cost model");
  }
}
