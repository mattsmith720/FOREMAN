import { proxyBinaryToBackend } from "../../../../lib/proxy-backend";

export const maxDuration = 30;

export async function POST(request: Request) {
  return proxyBinaryToBackend("/voice/speak", request);
}
