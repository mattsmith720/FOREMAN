import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy.js";

const ALLOWED_ORIGIN = "https://foreman-phi.vercel.app";

let originalAllowed: string | undefined;

before(() => {
  originalAllowed = process.env.ALLOWED_APP_ORIGINS;
  process.env.ALLOWED_APP_ORIGINS = ALLOWED_ORIGIN;
});

after(() => {
  if (originalAllowed === undefined) {
    delete process.env.ALLOWED_APP_ORIGINS;
  } else {
    process.env.ALLOWED_APP_ORIGINS = originalAllowed;
  }
});

function makeRequest(
  path: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(path, "https://foreman-phi.vercel.app"), {
    headers,
  });
}

describe("web proxy origin gate", () => {
  it("blocks /api/* calls without origin or referer", () => {
    const res = proxy(makeRequest("/api/analyse"));
    assert.equal(res.status, 403);
  });

  it("blocks /api/* calls from a foreign origin", () => {
    const res = proxy(
      makeRequest("/api/analyse", {
        origin: "https://attacker.example",
        referer: "https://attacker.example/page",
      }),
    );
    assert.equal(res.status, 403);
  });

  it("blocks /api/* calls when only an unrelated referer is present", () => {
    const res = proxy(
      makeRequest("/api/transcribe", {
        referer: "https://google.com/search?q=foreman",
      }),
    );
    assert.equal(res.status, 403);
  });

  it("allows /api/* calls from the explicit allowed origin", () => {
    const res = proxy(
      makeRequest("/api/analyse", { origin: ALLOWED_ORIGIN }),
    );
    assert.notEqual(res.status, 403);
  });

  it("allows /api/* calls with referer matching the allowed origin", () => {
    const res = proxy(
      makeRequest("/api/analyse", {
        referer: `${ALLOWED_ORIGIN}/coach`,
      }),
    );
    assert.notEqual(res.status, 403);
  });

  it("allows /api/health without origin", () => {
    const res = proxy(makeRequest("/api/health"));
    assert.notEqual(res.status, 403);
  });

  it("does not gate non-/api routes", () => {
    const res = proxy(makeRequest("/dashboard"));
    assert.notEqual(res.status, 403);
  });

  it("blocks bypass attempts where attacker referer just contains '.vercel.app' as substring", () => {
    const res = proxy(
      makeRequest("/api/analyse", {
        referer: "https://attacker.example/?from=foreman.vercel.app",
      }),
    );
    assert.equal(res.status, 403);
  });

  it("blocks bypass attempts where attacker referer contains the host as substring", () => {
    const res = proxy(
      makeRequest("/api/analyse", {
        host: "foreman-phi.vercel.app",
        referer: "https://attacker.example/foreman-phi.vercel.app/",
      }),
    );
    assert.equal(res.status, 403);
  });

  it("allows /api/* calls from a same-project preview at *.vercel.app", () => {
    const res = proxy(
      makeRequest("/api/analyse", {
        origin: "https://foreman-git-feat-something.vercel.app",
      }),
    );
    assert.notEqual(res.status, 403);
  });
});
