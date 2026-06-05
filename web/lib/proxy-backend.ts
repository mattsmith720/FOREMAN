const API_KEY_HEADER = "x-foreman-api-key";

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL?.trim() || "http://127.0.0.1:8080";
  return url.replace(/\/$/, "");
}

export async function proxyToBackend(
  path: string,
  request: Request,
): Promise<Response> {
  const backendUrl = getBackendUrl();
  const url = `${backendUrl}${path}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const apiKey = process.env.FOREMAN_API_KEY?.trim();
  if (apiKey) {
    headers.set(API_KEY_HEADER, apiKey);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(url, init);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "content-type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
