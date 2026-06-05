import { proxyToBackend } from "../../../../../lib/proxy-backend";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  return proxyToBackend(`/sessions/${params.id}/stop`, request);
}
