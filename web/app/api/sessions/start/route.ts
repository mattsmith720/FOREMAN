import { proxyToBackend } from "../../../../lib/proxy-backend";

export async function POST(request: Request) {
  return proxyToBackend("/sessions/start", request);
}
