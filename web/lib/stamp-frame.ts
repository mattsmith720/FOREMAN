/** Burn ISO timestamp + coordinates into the JPEG for CER submittable evidence. */
export function stampEvidenceOverlay(
  canvas: HTMLCanvasElement,
  meta: { capturedAt: string; lat: number | null; lng: number | null },
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return;
  }

  const lines = [
    meta.capturedAt.replace("T", " ").replace(/\.\d{3}Z$/, " UTC"),
    meta.lat !== null && meta.lng !== null
      ? `${meta.lat.toFixed(5)}, ${meta.lng.toFixed(5)}`
      : "GPS pending",
  ];

  const pad = Math.max(8, Math.round(canvas.width * 0.02));
  const lineHeight = Math.max(14, Math.round(canvas.height * 0.035));
  const boxH = pad * 2 + lineHeight * lines.length;
  const boxW = Math.min(canvas.width, Math.round(canvas.width * 0.92));

  ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
  ctx.fillRect(pad, canvas.height - boxH - pad, boxW, boxH);

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${lineHeight}px system-ui, sans-serif`;
  lines.forEach((line, index) => {
    ctx.fillText(line, pad * 2, canvas.height - boxH + pad + lineHeight * (index + 0.85));
  });
}
