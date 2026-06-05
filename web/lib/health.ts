import { getApiUrl } from "./api-url";
import { parseApiResponse } from "./parse-api-response";

export async function checkApiHealth(): Promise<void> {
  const response = await fetch(`${getApiUrl()}/health`, {
    method: "GET",
    cache: "no-store",
  });

  await parseApiResponse<{ status: string }>(response);
}
