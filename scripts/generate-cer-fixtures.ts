/**
 * Generate versioned synthetic CER eval JPEGs under backend/eval/frames/.
 *
 * Requires sharp (not a repo dependency — install ephemerally):
 *   npm install sharp --no-save && npx tsx scripts/generate-cer-fixtures.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "backend/eval/frames");
const W = 640;
const H = 480;
const VERSION = "v1";

interface FrameSpec {
  filename: string;
  title: string;
  subtitle: string;
  panels: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    fill: string;
    stroke?: string;
    label: string;
    labelColor?: string;
  }>;
  banner?: { text: string; color: string };
  footer?: string;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgFor(spec: FrameSpec): string {
  const panelSvg = spec.panels
    .map((p) => {
      const lx = p.x + 8;
      const ly = p.y + Math.min(22, p.h - 8);
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.fill}" stroke="${p.stroke ?? "#1f2937"}" stroke-width="2" rx="4"/>
<text x="${lx}" y="${ly}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="${p.labelColor ?? "#111827"}">${esc(p.label)}</text>`;
    })
    .join("\n");

  const banner = spec.banner
    ? `<rect x="0" y="0" width="${W}" height="36" fill="${spec.banner.color}"/>
<text x="12" y="24" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${esc(spec.banner.text)}</text>`
    : "";

  const footer = spec.footer
    ? `<text x="12" y="${H - 12}" font-family="Arial, Helvetica, sans-serif" font-size="11" fill="#6b7280">${esc(spec.footer)}</text>`
    : "";

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#e5e7eb"/>
${banner}
<text x="12" y="${spec.banner ? 58 : 28}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#111827">${esc(spec.title)}</text>
<text x="12" y="${spec.banner ? 78 : 48}" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#374151">${esc(spec.subtitle)}</text>
${panelSvg}
${footer}
</svg>`;
}

const FRAMES: FrameSpec[] = [
  {
    filename: "switchboard-no-shutdown-label.jpg",
    title: "Main switchboard",
    subtitle: "Emergency shutdown procedure label NOT fitted",
    banner: { text: "NON-COMPLIANT — shutdown label missing", color: "#dc2626" },
    panels: [
      { x: 40, y: 110, w: 560, h: 280, fill: "#d1d5db", label: "MAIN SWITCHBOARD" },
      { x: 70, y: 150, w: 80, h: 120, fill: "#374151", label: "MAIN" },
      { x: 170, y: 150, w: 80, h: 120, fill: "#374151", label: "SOLAR" },
      { x: 270, y: 150, w: 80, h: 120, fill: "#374151", label: "INV" },
      {
        x: 400,
        y: 150,
        w: 170,
        h: 120,
        fill: "#fecaca",
        stroke: "#dc2626",
        label: "NO SHUTDOWN LABEL",
        labelColor: "#991b1b",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "switchboard-shutdown-label-v1.jpg",
    title: "Main switchboard",
    subtitle: "Emergency shutdown procedure label fitted",
    banner: { text: "COMPLIANT — shutdown label present", color: "#16a34a" },
    panels: [
      { x: 40, y: 110, w: 560, h: 280, fill: "#d1d5db", label: "MAIN SWITCHBOARD" },
      { x: 70, y: 150, w: 80, h: 120, fill: "#374151", label: "MAIN" },
      { x: 170, y: 150, w: 80, h: 120, fill: "#374151", label: "SOLAR" },
      { x: 270, y: 150, w: 80, h: 120, fill: "#374151", label: "INV" },
      {
        x: 400,
        y: 150,
        w: 170,
        h: 120,
        fill: "#fca5a5",
        stroke: "#b91c1c",
        label: "EMERGENCY SHUTDOWN PROCEDURE",
        labelColor: "#7f1d1d",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "missing-signage.jpg",
    title: "Inverter station signage",
    subtitle: "Solar supply main switch label missing",
    banner: { text: "NON-COMPLIANT — main switch label missing", color: "#dc2626" },
    panels: [
      { x: 40, y: 110, w: 560, h: 280, fill: "#cbd5e1", label: "INVERTER STATION" },
      { x: 80, y: 160, w: 200, h: 180, fill: "#64748b", label: "INVERTER" },
      {
        x: 320,
        y: 160,
        w: 240,
        h: 180,
        fill: "#fecaca",
        stroke: "#dc2626",
        label: "BLANK — NO SOLAR SUPPLY MAIN SWITCH",
        labelColor: "#991b1b",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "switch-label-v1.jpg",
    title: "Inverter station signage",
    subtitle: "Solar supply main switch label fitted",
    banner: { text: "COMPLIANT — main switch label present", color: "#16a34a" },
    panels: [
      { x: 40, y: 110, w: 560, h: 280, fill: "#cbd5e1", label: "INVERTER STATION" },
      { x: 80, y: 160, w: 200, h: 180, fill: "#64748b", label: "INVERTER" },
      {
        x: 320,
        y: 160,
        w: 240,
        h: 180,
        fill: "#bbf7d0",
        stroke: "#15803d",
        label: "SOLAR SUPPLY MAIN SWITCH",
        labelColor: "#14532d",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "isolator-unlabelled.jpg",
    title: "Rooftop DC isolator",
    subtitle: "Isolator fitted but DC signage missing",
    banner: { text: "NON-COMPLIANT — DC isolator unlabelled", color: "#dc2626" },
    panels: [
      { x: 40, y: 100, w: 560, h: 300, fill: "#fef3c7", label: "ROOF ARRAY ENTRY" },
      {
        x: 220,
        y: 160,
        w: 200,
        h: 160,
        fill: "#9ca3af",
        stroke: "#dc2626",
        label: "DC ISOLATOR — NO LABEL",
        labelColor: "#991b1b",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "dc-isolator-labelled-v1.jpg",
    title: "Rooftop DC isolator",
    subtitle: "Isolator installed and labelled",
    banner: { text: "COMPLIANT — DC isolator labelled", color: "#16a34a" },
    panels: [
      { x: 40, y: 100, w: 560, h: 300, fill: "#fef3c7", label: "ROOF ARRAY ENTRY" },
      {
        x: 220,
        y: 160,
        w: 200,
        h: 160,
        fill: "#9ca3af",
        stroke: "#15803d",
        label: "DC ISOLATOR",
        labelColor: "#14532d",
      },
      {
        x: 230,
        y: 250,
        w: 180,
        h: 40,
        fill: "#fde047",
        stroke: "#ca8a04",
        label: "PV ARRAY DC ISOLATOR",
        labelColor: "#713f12",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "dc-not-in-conduit.jpg",
    title: "DC cable run",
    subtitle: "Exposed DC conductors — no conduit",
    banner: { text: "NON-COMPLIANT — DC not in conduit", color: "#dc2626" },
    panels: [
      { x: 40, y: 90, w: 560, h: 310, fill: "#bfdbfe", label: "ROOF / WALL SURFACE" },
      {
        x: 80,
        y: 200,
        w: 480,
        h: 12,
        fill: "#ea580c",
        stroke: "#c2410c",
        label: "EXPOSED DC CABLE — NO CONDUIT",
        labelColor: "#9a3412",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "dc-in-conduit-v1.jpg",
    title: "DC cable run",
    subtitle: "DC conductors protected in listed conduit",
    banner: { text: "COMPLIANT — DC in conduit", color: "#16a34a" },
    panels: [
      { x: 40, y: 90, w: 560, h: 310, fill: "#bfdbfe", label: "ROOF / WALL SURFACE" },
      {
        x: 80,
        y: 190,
        w: 480,
        h: 32,
        fill: "#6b7280",
        stroke: "#374151",
        label: "UV-RATED DC CONDUIT",
        labelColor: "#f9fafb",
      },
      {
        x: 120,
        y: 202,
        w: 400,
        h: 8,
        fill: "#ea580c",
        label: "DC CABLE INSIDE",
        labelColor: "#fff7ed",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "serial-plate.jpg",
    title: "Inverter compliance plate",
    subtitle: "Serial unreadable — glare / motion blur",
    banner: { text: "NON-COMPLIANT — serial not legible for REC", color: "#dc2626" },
    panels: [
      { x: 40, y: 100, w: 560, h: 300, fill: "#64748b", label: "INVERTER ENCLOSURE" },
      {
        x: 160,
        y: 160,
        w: 320,
        h: 180,
        fill: "#e2e8f0",
        stroke: "#dc2626",
        label: "SERIAL: ??????  GLARE",
        labelColor: "#64748b",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
  {
    filename: "serial-plate-clear-v1.jpg",
    title: "Inverter compliance plate",
    subtitle: "Serial legible for REC registry match",
    banner: { text: "COMPLIANT — serial plate legible", color: "#16a34a" },
    panels: [
      { x: 40, y: 100, w: 560, h: 300, fill: "#64748b", label: "INVERTER ENCLOSURE" },
      {
        x: 160,
        y: 160,
        w: 320,
        h: 180,
        fill: "#f8fafc",
        stroke: "#15803d",
        label: "S/N: FRN-INV-2026-004821",
        labelColor: "#0f172a",
      },
    ],
    footer: `synthetic CER fixture ${VERSION}`,
  },
];

export interface FrameManifestEntry {
  id: string;
  defectClass: string;
  compliant: boolean;
  path: string;
  usedByScenarios: string[];
}

export const MANIFEST_ENTRIES: FrameManifestEntry[] = [
  {
    id: "cer-shutdown-label-fail-v1",
    defectClass: "shutdown_label",
    compliant: false,
    path: "eval/frames/switchboard-no-shutdown-label.jpg",
    usedByScenarios: ["cer-no-shutdown-label"],
  },
  {
    id: "cer-shutdown-label-pass-v1",
    defectClass: "shutdown_label",
    compliant: true,
    path: "eval/frames/switchboard-shutdown-label-v1.jpg",
    usedByScenarios: [],
  },
  {
    id: "cer-missing-switch-label-fail-v1",
    defectClass: "missing_switch_label",
    compliant: false,
    path: "eval/frames/missing-signage.jpg",
    usedByScenarios: ["cer-missing-signage"],
  },
  {
    id: "cer-missing-switch-label-pass-v1",
    defectClass: "missing_switch_label",
    compliant: true,
    path: "eval/frames/switch-label-v1.jpg",
    usedByScenarios: [],
  },
  {
    id: "cer-dc-isolator-fail-v1",
    defectClass: "dc_isolator",
    compliant: false,
    path: "eval/frames/isolator-unlabelled.jpg",
    usedByScenarios: ["cer-isolator-unlabelled"],
  },
  {
    id: "cer-dc-isolator-pass-v1",
    defectClass: "dc_isolator",
    compliant: true,
    path: "eval/frames/dc-isolator-labelled-v1.jpg",
    usedByScenarios: [],
  },
  {
    id: "cer-dc-conduit-fail-v1",
    defectClass: "dc_conduit",
    compliant: false,
    path: "eval/frames/dc-not-in-conduit.jpg",
    usedByScenarios: ["cer-dc-not-in-conduit"],
  },
  {
    id: "cer-dc-conduit-pass-v1",
    defectClass: "dc_conduit",
    compliant: true,
    path: "eval/frames/dc-in-conduit-v1.jpg",
    usedByScenarios: [],
  },
  {
    id: "cer-serial-plate-fail-v1",
    defectClass: "serial_plate",
    compliant: false,
    path: "eval/frames/serial-plate.jpg",
    usedByScenarios: ["cer-serial-capture"],
  },
  {
    id: "cer-serial-plate-pass-v1",
    defectClass: "serial_plate",
    compliant: true,
    path: "eval/frames/serial-plate-clear-v1.jpg",
    usedByScenarios: [],
  },
];

async function main(): Promise<void> {
  const sharp = (await import("sharp")).default;
  mkdirSync(OUT_DIR, { recursive: true });

  for (const spec of FRAMES) {
    const jpeg = await sharp(Buffer.from(svgFor(spec)))
      .jpeg({ quality: 88 })
      .toBuffer();
    writeFileSync(path.join(OUT_DIR, spec.filename), jpeg);
    console.log(`wrote ${spec.filename} (${jpeg.length} bytes)`);
  }

  const manifest = {
    version: VERSION,
    generator: "scripts/generate-cer-fixtures.ts",
    frames: MANIFEST_ENTRIES,
  };
  writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`wrote manifest.json (${MANIFEST_ENTRIES.length} frames)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
