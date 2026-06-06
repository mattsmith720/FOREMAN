const API_KEY_HEADER = "x-foreman-api-key";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BODY_BYTES = 2_000_000;

export class ProxyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ProxyError";
    this.status = status;
  }
}

interface ProxyOptions {
  timeoutMs?: number;
  maxBodyBytes?: number;
}

interface ProxyRequestOptions extends ProxyOptions {
  binary: boolean;
}

function getBackendUrl(): string {
  const configured = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:8080";
  const normalized = configured.replace(/\/$/, "");
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new ProxyError(500, "BACKEND_URL must start with http:// or https://");
    }
    return normalized;
  } catch {
    throw new ProxyError(500, "Invalid BACKEND_URL");
  }
}

function buildProxyHeaders(request: Request): Headers {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const sessionToken = request.headers.get("x-session-token");
  if (sessionToken) {
    headers.set("x-session-token", sessionToken);
  }

  const opsPassword = request.headers.get("x-ops-password");
  if (opsPassword) {
    headers.set("x-ops-password", opsPassword);
  }

  const apiKey = process.env.FOREMAN_API_KEY?.trim();
  if (apiKey) {
    headers.set(API_KEY_HEADER, apiKey);
  }

  return headers;
}

function assertProxyPath(path: string): void {
  if (!path.startsWith("/")) {
    throw new ProxyError(500, "Proxy path must start with /");
  }
}

async function readBoundedRequestBody(
  request: Request,
  maxBodyBytes: number,
): Promise<string> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > maxBodyBytes) {
      throw new ProxyError(413, "Request body too large");
    }
  }

  const body = await request.text();
  const bodyBytes = new TextEncoder().encode(body).byteLength;
  if (bodyBytes > maxBodyBytes) {
    throw new ProxyError(413, "Request body too large");
  }
  return body;
}

function createProxySignal(request: Request, timeoutMs: number): {
  signal: AbortSignal;
  timedOut: () => boolean;
  cleanup: () => void;
} {
  const controller = new AbortController();
  let didTimeout = false;
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);

  const abortFromRequest = () => controller.abort();
  request.signal.addEventListener("abort", abortFromRequest, { once: true });

  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", abortFromRequest);
    },
  };
}

async function proxyRequest(
  path: string,
  request: Request,
  options: ProxyRequestOptions,
): Promise<Response> {
  assertProxyPath(path);
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${path}`;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const proxySignal = createProxySignal(request, timeoutMs);

  const init: RequestInit = {
    method: request.method,
    headers: buildProxyHeaders(request),
    signal: proxySignal.signal,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await readBoundedRequestBody(request, maxBodyBytes);
  }

  try {
    const response = await fetch(url, init);
    if (options.binary) {
      const body = await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        headers: {
          "content-type":
            response.headers.get("content-type") ?? "application/octet-stream",
          "cache-control": response.headers.get("cache-control") ?? "no-store",
        },
      });
    }

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    if (error instanceof ProxyError) {
      throw error;
    }
    if (proxySignal.timedOut()) {
      throw new ProxyError(504, "Backend request timed out");
    }
    if (request.signal.aborted) {
      throw new ProxyError(408, "Request aborted by client");
    }
    throw new ProxyError(502, "Backend request failed");
  } finally {
    proxySignal.cleanup();
  }
}

export async function proxyToBackend(
  path: string,
  request: Request,
  options: ProxyOptions = {},
): Promise<Response> {
  return proxyRequest(path, request, { ...options, binary: false });
}

export async function proxyBinaryToBackend(
  path: string,
  request: Request,
  options: ProxyOptions = {},
): Promise<Response> {
  return proxyRequest(path, request, { ...options, binary: true });
}

export function createProxyErrorResponse(
  error: unknown,
  fallbackMessage: string,
): Response {
  if (error instanceof ProxyError) {
    return Response.json(
      { ok: false, error: error.message },
      { status: error.status },
    );
  }

  return Response.json(
    { ok: false, error: fallbackMessage },
    { status: 500 },
  );
}
