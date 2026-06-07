import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEvidencePackManifest,
  buildEvidencePackZip,
  createZipArchive,
  extractEvidenceRecords,
  evidencePackFilename,
  type EvidenceFrameRow,
} from "./evidence-pack.js";

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

describe("extractEvidenceRecords", () => {
  it("keeps one good frame per guided shot", () => {
    const records = extractEvidenceRecords([
      frame("a1", "setup"),
      frame("a2", "setup"),
      frame("b1", "meter_box"),
    ]);

    assert.equal(records.length, 2);
    assert.deepEqual(
      records.map((record) => record.shotId),
      ["setup", "meter_box"],
    );
    assert.equal(records[0]?.zipEntry, "setup.jpeg");
  });

  it("skips frames marked as bad evidence", () => {
    const records = extractEvidenceRecords([
      frame("a1", "switchboard", {
        analysis: {
          evidenceShot: { type: "switchboard", isGoodEvidence: false },
        },
      }),
      frame("a2", "switchboard"),
    ]);

    assert.equal(records.length, 1);
    assert.equal(records[0]?.frameId, "a2");
  });
});

describe("buildEvidencePackManifest", () => {
  it("reports guided-shot progress", () => {
    const records = extractEvidenceRecords([
      frame("a1", "setup"),
      frame("b1", "meter_box"),
    ]);
    const manifest = buildEvidencePackManifest(SESSION_ID, records);

    assert.equal(manifest.sessionId, SESSION_ID);
    assert.equal(manifest.progress.done, 2);
    assert.equal(manifest.progress.total, 6);
    assert.equal(manifest.records.length, 2);
  });
});

describe("createZipArchive", () => {
  it("produces a readable store-only zip", () => {
    const zip = createZipArchive([
      { name: "manifest.json", data: Buffer.from('{"ok":true}', "utf8") },
      { name: "setup.jpeg", data: Buffer.from([0xff, 0xd8, 0xff]) },
    ]);

    assert.ok(zip.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])));
    assert.ok(
      zip
        .subarray(zip.length - 22, zip.length - 18)
        .equals(Buffer.from([0x50, 0x4b, 0x05, 0x06])),
    );
    assert.ok(zip.includes(Buffer.from("manifest.json", "utf8")));
    assert.ok(zip.includes(Buffer.from("setup.jpeg", "utf8")));
  });
});

describe("buildEvidencePackZip", () => {
  it("assembles manifest and stamped JPEG bytes", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const zip = await buildEvidencePackZip(SESSION_ID, {
      getEvidenceFrames: async () => [frame("f1", "serial_plate")],
      downloadFrame: async () => jpeg,
    });

    assert.ok(zip.includes(Buffer.from("manifest.json", "utf8")));
    assert.ok(zip.includes(Buffer.from("serial_plate.jpeg", "utf8")));
    assert.ok(zip.includes(jpeg));
  });
});

describe("evidencePackFilename", () => {
  it("uses the first eight session id characters", () => {
    assert.equal(
      evidencePackFilename(SESSION_ID),
      "foreman-evidence-f5e2d446.zip",
    );
  });
});
