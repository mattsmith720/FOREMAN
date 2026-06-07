import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEvidencePackManifest,
  buildEvidencePackZip,
  createZipArchive,
  extractEvidenceRecords,
  type EvidenceFrameRow,
} from "./evidence-pack.js";
import {
  readZipArchive,
  validateEvidencePackZip,
} from "./pack-validator.js";

const SESSION_ID = "f5e2d446-71e8-48cf-b13a-2f3ecf781f40";

function frame(
  id: string,
  shotId: string,
  overrides: Partial<EvidenceFrameRow> = {},
): EvidenceFrameRow {
  return {
    id,
    ts: "2026-06-07T10:00:00.000Z",
    storage_ref: `${SESSION_ID}/${id}.jpeg`,
    analysis: {
      foremanEvidence: {
        capturedAt: "2026-06-07T10:00:00.000Z",
        lat: -33.8688,
        lng: 151.2093,
        complianceShotId: shotId,
      },
      evidenceShot: { type: shotId, isGoodEvidence: true },
    },
    ...overrides,
  };
}

function allGuidedFrames(): EvidenceFrameRow[] {
  return [
    frame("a1", "setup"),
    frame("a2", "meter_box"),
    frame("a3", "switchboard"),
    frame("a4", "serial_plate"),
    frame("a5", "battery_label"),
    frame("a6", "testing"),
  ];
}

describe("readZipArchive", () => {
  it("reads entries from store-only archives", () => {
    const zip = createZipArchive([
      { name: "manifest.json", data: Buffer.from('{"ok":true}', "utf8") },
      { name: "setup.jpeg", data: Buffer.from([0xff, 0xd8, 0xff]) },
    ]);

    const entries = readZipArchive(zip);
    assert.equal(entries.length, 2);
    assert.equal(entries[0]?.name, "manifest.json");
    assert.equal(entries[1]?.name, "setup.jpeg");
  });
});

describe("validateEvidencePackZip", () => {
  it("passes a complete evidence pack built from guided frames", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const zip = await buildEvidencePackZip(SESSION_ID, {
      getEvidenceFrames: async () => allGuidedFrames(),
      downloadFrame: async () => jpeg,
    });

    const report = validateEvidencePackZip(zip);
    assert.equal(report.ok, true);
    assert.equal(report.sessionId, SESSION_ID);
    assert.deepEqual(report.presentShots, [
      "setup",
      "meter_box",
      "switchboard",
      "serial_plate",
      "battery_label",
      "testing",
    ]);
    assert.deepEqual(report.missingShots, []);
    assert.equal(report.stampFieldsPresent.length, 6);
    assert.ok(report.stampFieldsPresent.every((stamp) => stamp.capturedAt));
    assert.ok(report.stampFieldsPresent.every((stamp) => stamp.hasGps));
  });

  it("reports missing guided shots and absent JPEGs", () => {
    const records = extractEvidenceRecords([frame("a1", "setup")]);
    const manifest = buildEvidencePackManifest(SESSION_ID, records);
    const zip = createZipArchive([
      {
        name: "manifest.json",
        data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
      },
    ]);

    const report = validateEvidencePackZip(zip);
    assert.equal(report.ok, false);
    assert.deepEqual(report.presentShots, []);
    assert.ok(report.missingShots.includes("meter_box"));
    assert.ok(report.errors.some((error) => error.includes("setup.jpeg")));
    assert.ok(report.errors.some((error) => error.includes("Missing guided shots")));
  });

  it("flags shotId and zipEntry mismatches", () => {
    const records = extractEvidenceRecords([frame("a1", "setup")]);
    records[0]!.zipEntry = "meter_box.jpeg";
    const manifest = buildEvidencePackManifest(SESSION_ID, records);
    const zip = createZipArchive([
      {
        name: "manifest.json",
        data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
      },
      { name: "meter_box.jpeg", data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    ]);

    const report = validateEvidencePackZip(zip);
    assert.equal(report.ok, false);
    assert.ok(
      report.errors.some((error) => error.includes('does not match zipEntry "meter_box.jpeg"')),
    );
  });

  it("flags records missing capturedAt stamp fields", () => {
    const records = extractEvidenceRecords([
      frame("a1", "setup", {
        analysis: {
          foremanEvidence: { lat: null, lng: null, complianceShotId: "setup" },
          evidenceShot: { type: "setup", isGoodEvidence: true },
        },
      }),
    ]);
    records[0]!.capturedAt = "";
    const manifest = buildEvidencePackManifest(SESSION_ID, records);
    const zip = createZipArchive([
      {
        name: "manifest.json",
        data: Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
      },
      { name: "setup.jpeg", data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    ]);

    const report = validateEvidencePackZip(zip);
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((error) => error.includes("missing capturedAt")));
    assert.equal(report.stampFieldsPresent[0]?.capturedAt, false);
  });

  it("requires manifest.json", () => {
    const zip = createZipArchive([
      { name: "setup.jpeg", data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    ]);

    const report = validateEvidencePackZip(zip);
    assert.equal(report.ok, false);
    assert.ok(report.errors.includes("Missing manifest.json"));
  });
});
