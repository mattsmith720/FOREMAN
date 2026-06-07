import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSession } from "./db/sessions.js";
import { getSupabase } from "./db/supabase.js";
import {
  buildEvidencePackManifest,
  extractEvidenceRecords,
  type EvidenceFrameRow,
  type EvidencePackDependencies,
} from "./evidence-pack.js";

async function getEvidenceFrames(sessionId: string): Promise<EvidenceFrameRow[]> {
  const supabase = getSupabase();
  const result = await supabase
    .from("frames")
    .select("id, ts, storage_ref, analysis")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true });
  if (result.error) {
    throw new Error(result.error.message);
  }
  return (result.data ?? []) as EvidenceFrameRow[];
}

const defaultDependencies: EvidencePackDependencies = {
  getEvidenceFrames,
  downloadFrame: async () => Buffer.alloc(0),
};

export async function buildEvidenceReportPdf(
  sessionId: string,
  dependencies: EvidencePackDependencies = defaultDependencies,
): Promise<Uint8Array> {
  const session = await getSession(sessionId);
  const frames = await dependencies.getEvidenceFrames(sessionId);
  const records = extractEvidenceRecords(frames);
  const manifest = buildEvidencePackManifest(sessionId, records);

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]);
  const margin = 48;
  let y = 800;

  const draw = (text: string, size = 11, useBold = false) => {
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= size + 6;
  };

  draw("Foreman — CER evidence report", 18, true);
  draw(`Session ${sessionId}`, 10);
  draw(`Worker: ${session.worker ?? "—"}`, 11);
  draw(`Job type: ${session.job_type ?? "—"}`, 11);
  draw(`Started: ${session.started_at}`, 11);
  draw(`Ended: ${session.ended_at ?? "in progress"}`, 11);
  y -= 8;
  draw("Guided compliance shots", 14, true);

  for (const record of manifest.records) {
    const geo =
      record.lat != null && record.lng != null
        ? `${record.lat.toFixed(5)}, ${record.lng.toFixed(5)}`
        : "no geo";
    draw(
      `• ${record.shotId} — ${record.capturedAt} — ${geo}`,
      10,
    );
  }

  y -= 8;
  draw("Defect log (from frame analysis)", 14, true);
  let defectLines = 0;
  for (const frame of frames) {
    const analysis = frame.analysis as Record<string, unknown> | null;
    const defects = analysis?.defects;
    if (!Array.isArray(defects)) {
      continue;
    }
    for (const defect of defects) {
      if (defect && typeof defect === "object" && "message" in defect) {
        draw(`• ${String((defect as { message?: string }).message ?? "defect")}`, 10);
        defectLines += 1;
        if (defectLines >= 12) {
          break;
        }
      }
    }
    if (defectLines >= 12) {
      break;
    }
  }
  if (defectLines === 0) {
    draw("No structured defects logged on frames.", 10);
  }

  y -= 8;
  draw(
    `Progress: ${manifest.progress.done}/${manifest.progress.total} shots · generated ${manifest.generatedAt}`,
    9,
  );

  return pdf.save();
}

export function evidenceReportFilename(sessionId: string): string {
  return `foreman-report-${sessionId.slice(0, 8)}.pdf`;
}
