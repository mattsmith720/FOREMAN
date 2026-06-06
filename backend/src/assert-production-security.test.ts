import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionSecurity } from "./assert-production-security.js";
import { getCorsOrigins } from "./config.js";

type EnvSnapshot = {
  NODE_ENV?: string;
  FOREMAN_API_KEY?: string;
  SESSION_TOKEN_SECRET?: string;
  CORS_ORIGINS?: string;
};

const KEYS: (keyof EnvSnapshot)[] = [
  "NODE_ENV",
  "FOREMAN_API_KEY",
  "SESSION_TOKEN_SECRET",
  "CORS_ORIGINS",
];

function snapshot(): EnvSnapshot {
  const out: EnvSnapshot = {};
  for (const key of KEYS) {
    out[key] = process.env[key];
  }
  return out;
}

function applyEnv(values: EnvSnapshot): void {
  for (const key of KEYS) {
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }
}

function withProductionEnv<T>(env: EnvSnapshot, run: () => T): T {
  const original = snapshot();
  applyEnv({ NODE_ENV: "production", ...env });
  try {
    return run();
  } finally {
    applyEnv(original);
  }
}

test("assertProductionSecurity is a no-op outside production", () => {
  const original = snapshot();
  applyEnv({ NODE_ENV: "development" });
  try {
    assert.doesNotThrow(() => assertProductionSecurity());
  } finally {
    applyEnv(original);
  }
});

test("assertProductionSecurity throws when FOREMAN_API_KEY is missing in production", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "https://foreman-phi.vercel.app",
    },
    () => {
      assert.throws(
        () => assertProductionSecurity(),
        /FOREMAN_API_KEY is required in production/,
      );
    },
  );
});

test("assertProductionSecurity throws when CORS_ORIGINS is missing in production", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "abc-secret",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "",
    },
    () => {
      assert.throws(
        () => assertProductionSecurity(),
        /CORS_ORIGINS must list explicit browser origins in production/,
      );
    },
  );
});

test("assertProductionSecurity rejects wildcard CORS in production", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "abc-secret",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "*",
    },
    () => {
      assert.throws(
        () => assertProductionSecurity(),
        /CORS_ORIGINS must list explicit browser origins in production/,
      );
    },
  );
});

test("assertProductionSecurity passes when both required envs are set", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "abc-secret",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "https://foreman-phi.vercel.app,https://foreman.example",
    },
    () => {
      assert.doesNotThrow(() => assertProductionSecurity());
    },
  );
});

test("getCorsOrigins refuses to return wildcard in production", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "abc-secret",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "",
    },
    () => {
      assert.throws(
        () => getCorsOrigins(),
        /CORS_ORIGINS must be set in production/,
      );
    },
  );
});

test("getCorsOrigins returns the explicit list in production when set", () => {
  withProductionEnv(
    {
      FOREMAN_API_KEY: "abc-secret",
      SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      CORS_ORIGINS: "https://foreman-phi.vercel.app, https://foreman.example",
    },
    () => {
      const origins = getCorsOrigins();
      assert.deepEqual(origins, [
        "https://foreman-phi.vercel.app",
        "https://foreman.example",
      ]);
    },
  );
});

test("backend startup module fails to load when production env is missing FOREMAN_API_KEY", async () => {
  const { spawnSync } = await import("node:child_process");
  const path = await import("node:path");
  const fileUrl = await import("node:url");

  const here = path.dirname(fileUrl.fileURLToPath(import.meta.url));
  const moduleSpecifier = path.join(here, "assert-production-security.ts");

  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "-e",
      `import('${moduleSpecifier.replace(/\\/g, "/")}').then((m) => { m.assertProductionSecurity(); console.log('did-not-throw'); }).catch((err) => { console.error('THREW:' + err.message); process.exit(2); });`,
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        FOREMAN_API_KEY: "",
        CORS_ORIGINS: "https://foreman-phi.vercel.app",
        SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
      },
      encoding: "utf8",
    },
  );

  assert.notEqual(
    result.status,
    0,
    `expected non-zero exit; got status ${result.status}, stdout: ${result.stdout}, stderr: ${result.stderr}`,
  );
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.match(combined, /FOREMAN_API_KEY is required in production/);
});

test("backend startup module fails to load when production env is missing CORS_ORIGINS", async () => {
  const { spawnSync } = await import("node:child_process");
  const path = await import("node:path");
  const fileUrl = await import("node:url");

  const here = path.dirname(fileUrl.fileURLToPath(import.meta.url));
  const moduleSpecifier = path.join(here, "assert-production-security.ts");

  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "-e",
      `import('${moduleSpecifier.replace(/\\/g, "/")}').then((m) => { m.assertProductionSecurity(); console.log('did-not-throw'); }).catch((err) => { console.error('THREW:' + err.message); process.exit(2); });`,
    ],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        FOREMAN_API_KEY: "abc-secret",
        SESSION_TOKEN_SECRET: "explicit-session-secret-for-test",
        CORS_ORIGINS: "",
      },
      encoding: "utf8",
    },
  );

  assert.notEqual(
    result.status,
    0,
    `expected non-zero exit; got status ${result.status}, stdout: ${result.stdout}, stderr: ${result.stderr}`,
  );
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.match(combined, /CORS_ORIGINS must list explicit browser origins/);
});
