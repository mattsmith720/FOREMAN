export async function parseApiResponse<T>(
  response: Response,
): Promise<T & { error?: string }> {
  const text = await response.text();

  let body: T & { error?: string };
  try {
    body = JSON.parse(text) as T & { error?: string };
  } catch {
    const preview = text.trim().slice(0, 80);
    if (response.status === 404) {
      throw new Error(
        "API not found. Set BACKEND_URL on Vercel to your Render API URL. See YOUR_TODO.md.",
      );
    }
    if (response.status === 401) {
      throw new Error(
        "API unauthorized. Set matching FOREMAN_API_KEY on Vercel and Render.",
      );
    }
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        "API timed out or is waking up (Render cold start). Wait 60s and retry.",
      );
    }
    if (response.status === 503) {
      throw new Error(
        "API unavailable — check API keys and Supabase config on Render.",
      );
    }
    if (response.status === 413) {
      throw new Error(
        "Image or audio too large for the server. Retry in a moment — frames are now compressed automatically.",
      );
    }
    if (preview.startsWith("<") || preview.toLowerCase().includes("<!doctype")) {
      throw new Error(
        `API returned HTML instead of JSON (${response.status}). Check BACKEND_URL and that the backend is running.`,
      );
    }
    throw new Error(
      `API returned invalid JSON (${response.status}): ${preview || "empty response"}`,
    );
  }

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return body as T & { error?: string };
}
