import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import {
  downloadEvidencePack,
  evidencePackFilename,
} from "./evidence-pack.js";

const SESSION_ID = "f5e2d446-71e8-48cf-b13a-2f3ecf781f40";

describe("evidencePackFilename", () => {
  it("matches backend naming convention", () => {
    assert.equal(
      evidencePackFilename(SESSION_ID),
      "foreman-evidence-f5e2d446.zip",
    );
  });
});

describe("downloadEvidencePack", () => {
  const originalFetch = globalThis.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalDocument = (globalThis as { document?: Document }).document;

  function installBrowserShims(anchor: {
    href: string;
    download: string;
    click: () => void;
  }) {
    const doc = {
      createElement: (tag: string) => {
        assert.equal(tag, "a");
        return anchor;
      },
    };
    (globalThis as { document?: typeof doc; window?: typeof globalThis }).document =
      doc;
    (globalThis as { window?: typeof globalThis }).window = globalThis;
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    if (originalDocument) {
      (globalThis as { document?: Document }).document = originalDocument;
    } else {
      delete (globalThis as { document?: Document }).document;
    }
    delete (globalThis as { window?: Window }).window;
    mock.restoreAll();
  });

  it("downloads the zip blob when the pack endpoint succeeds", async () => {
    const clicks: string[] = [];
    const anchor = {
      href: "",
      download: "",
      click() {
        clicks.push(this.download);
      },
    };

    installBrowserShims(anchor);
    URL.createObjectURL = () => "blob:evidence";
    URL.revokeObjectURL = () => undefined;

    globalThis.fetch = async () =>
      new Response(new Uint8Array([0x50, 0x4b, 0x03, 0x04]), {
        status: 200,
        headers: { "content-type": "application/zip" },
      });

    await downloadEvidencePack(SESSION_ID);

    assert.deepEqual(clicks, [evidencePackFilename(SESSION_ID)]);
  });

  it("throws when the pack endpoint fails", async () => {
    installBrowserShims({
      href: "",
      download: "",
      click: () => undefined,
    });

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "nope" }), { status: 500 });

    await assert.rejects(
      () => downloadEvidencePack(SESSION_ID),
      /nope/,
    );
  });
});
