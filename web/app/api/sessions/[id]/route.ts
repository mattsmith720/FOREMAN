import { proxyToBackend } from "../../../../lib/proxy-backend";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  return proxyToBackend(`/sessions/${params.id}`, request);
}
