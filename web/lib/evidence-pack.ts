import { apiFetch } from "./api-fetch";

export function evidencePackFilename(sessionId: string): string {
  return `foreman-evidence-${sessionId.slice(0, 8)}.zip`;
}

/**
 * Download the server-assembled CER evidence ZIP (manifest + stamped JPEGs).
 * Call after stopSession when solar_install compliance shots were captured.
 */
export async function downloadEvidencePack(sessionId: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const response = await apiFetch(`/sessions/${sessionId}/evidence-pack`, {
    method: "GET",
    retry: { retries: 1 },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail.trim() || `Evidence pack download failed (${response.status})`,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = evidencePackFilename(sessionId);
  anchor.click();
  URL.revokeObjectURL(url);
}
