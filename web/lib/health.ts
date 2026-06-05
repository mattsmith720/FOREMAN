import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";

export async function checkApiHealth(): Promise<void> {
  const response = await apiFetch("/health", {
    method: "GET",
    cache: "no-store",
  });

  await parseApiResponse<{ status: string }>(response);
}
