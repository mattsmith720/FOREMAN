import {
  createProxyErrorResponse,
  proxyBinaryToBackend,
} from "../../../../lib/proxy-backend";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    return await proxyBinaryToBackend("/voice/speak", request, {
      timeoutMs: 25_000,
      maxBodyBytes: 200_000,
    });
  } catch (error) {
    return createProxyErrorResponse(error, "Failed to proxy voice speak request");
  }
}
