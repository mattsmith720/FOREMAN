import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HEARTBEAT_INTERVAL_MS,
  SceneChangeGate,
  shouldAnalyseScene,
} from "./scene-change.js";

describe("shouldAnalyseScene", () => {
  it("always analyses the first frame", () => {
    assert.equal(shouldAnalyseScene("abc", null, 0), true);
  });

  it("skips when hash unchanged and inside heartbeat", () => {
    assert.equal(shouldAnalyseScene("abc", "abc", 1000), false);
  });

  it("analyses when hash changes", () => {
    assert.equal(shouldAnalyseScene("def", "abc", 1000), true);
  });

  it("analyses on heartbeat even when hash unchanged", () => {
    assert.equal(
      shouldAnalyseScene("abc", "abc", HEARTBEAT_INTERVAL_MS),
      true,
    );
  });
});

function mockCanvas(lum = 128): HTMLCanvasElement {
  const data = new Uint8ClampedArray(64 * 64 * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
    data[i + 3] = 255;
  }
  return {
    width: 64,
    height: 64,
    getContext: () => ({
      getImageData: () => ({ data, width: 64, height: 64 }),
    }),
  } as unknown as HTMLCanvasElement;
}

describe("SceneChangeGate", () => {
  it("skips duplicate hash then emits after invalidate", () => {
    const gate = new SceneChangeGate();
    const canvas = mockCanvas();
    assert.equal(gate.evaluate(canvas).emit, true);
    assert.equal(gate.evaluate(canvas).emit, false);
    gate.invalidate();
    assert.equal(gate.evaluate(canvas).emit, true);
  });
});
