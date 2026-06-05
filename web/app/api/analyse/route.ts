import { proxyToBackend } from "../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(request: Request) {
  return proxyToBackend("/analyse", request);
}
