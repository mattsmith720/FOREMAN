import { proxyToBackend } from "../../../lib/proxy-backend";

export async function GET(request: Request) {
  return proxyToBackend("/health", request);
}
