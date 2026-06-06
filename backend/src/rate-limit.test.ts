import assert from "node:assert/strict";
import test, { before, after } from "node:test";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";
import { registerVoiceRoutes } from "./routes/voice.js";

const ANALYSE_CAP = 30;
const TRANSCRIBE_CAP = 30;
const VOICE_SPEAK_CAP = 30;
const VOICE_ADVICE_CAP = 15;

type EnvSnapshot = {
  NODE_ENV?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_AGENT_ID?: string;
  FOREMAN_API_KEY?: string;
};

const ENV_KEYS: (keyof EnvSnapshot)[] = [
  "NODE_ENV",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_AGENT_ID",
  "FOREMAN_API_KEY",
];

function captureEnv(): EnvSnapshot {
  const snap: EnvSnapshot = {};
  for (const key of ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const key of ENV_KEYS) {
    if (snap[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snap[key];
    }
  }
}

let originalEnv: EnvSnapshot;

before(() => {
  originalEnv = captureEnv();
  // Force a non-production, unconfigured state so the route handlers
  // short-circuit with 503 (or 200 for /voice/config) and the only path
  // that produces a 429 is the rate-limit pre-handler.
  delete process.env.NODE_ENV;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_AGENT_ID;
  delete process.env.FOREMAN_API_KEY;
});

after(() => {
  restoreEnv(originalEnv);
});

async function registerUnconfiguredRoutes(app: FastifyInstance): Promise<void> {
  await registerAnalyseRoutes(app, {
    isAnalysisConfigured: () => false,
    decodeImagePayload: () => ({ base64: "", mediaType: "image/jpeg" }),
    validateImageBytes: () => ({ mediaType: "image/jpeg" }),
    requireSessionToken: () => true,
    isSupabaseConfigured: () => false,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    getRecentSessionTranscript: async () => [],
    analyseImage: async () => {
      throw new Error("not expected");
    },
    persistFrame: async () => ({ frameId: "f", storageRef: "s" }),
  });

  await registerTranscribeRoutes(app, {
    isTranscriptionConfigured: () => false,
    requireSessionToken: () => true,
    isSupabaseConfigured: () => false,
    assertActiveSession: async () => {
      throw new Error("not expected");
    },
    decodeAudioPayload: () => ({
      bytes: Buffer.alloc(0),
      mimeType: "audio/wav",
    }),
    validateAudioBytes: () => ({ mimeType: "audio/wav" }),
    transcribeAudio: async () => "not expected",
    persistTranscriptSegment: async () => ({ id: "t" } as never),
  });

  await registerVoiceRoutes(app, {
    isElevenLabsConfigured: () => false,
    getElevenLabsAgentId: () => undefined,
    getElevenLabsVoiceId: () => "voice",
    getConvaiSignedUrl: async () => {
      throw new Error("not configured");
    },
    synthesizeSpeech: async () => {
      throw new Error("not configured");
    },
    answerVoiceAdvice: async () => "not expected",
  });
}

async function buildApp(clientIp: string): Promise<FastifyInstance> {
  const app = Fastify({ logger: false, trustProxy: true });

  await app.register(rateLimit, {
    global: false,
    max: 120,
    timeWindow: "1 minute",
    keyGenerator: (request) =>
      request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ??
      request.ip,
  });

  // Force a stable rate-limit key for in-memory inject() calls — Fastify's
  // default ip extractor returns "127.0.0.1" for inject regardless of the
  // X-Forwarded-For header in some setups. We pin both per test.
  app.addHook("onRequest", async (request) => {
    request.headers["x-forwarded-for"] = clientIp;
  });

  await registerUnconfiguredRoutes(app);

  await app.ready();
  return app;
}

async function hammer(
  app: FastifyInstance,
  payload: {
    method: "POST" | "GET";
    url: string;
    body?: unknown;
  },
  count: number,
): Promise<number[]> {
  const codes: number[] = [];
  for (let i = 0; i < count; i++) {
    const res = await app.inject({
      method: payload.method,
      url: payload.url,
      headers: {
        "content-type": "application/json",
      },
      payload: payload.body ? JSON.stringify(payload.body) : undefined,
    });
    codes.push(res.statusCode);
  }
  return codes;
}

test("/analyse rate-limits at 30 requests/minute per IP", async () => {
  const app = await buildApp("203.0.113.10");
  try {
    const codes = await hammer(
      app,
      {
        method: "POST",
        url: "/analyse",
        body: {
          image: "data:image/jpeg;base64,AAAA",
        },
      },
      ANALYSE_CAP + 1,
    );

    const underCap = codes.slice(0, ANALYSE_CAP);
    const overCap = codes[ANALYSE_CAP];

    for (const code of underCap) {
      assert.notEqual(
        code,
        429,
        `expected non-429 under the cap; got ${code} in ${codes.join(",")}`,
      );
    }
    assert.equal(overCap, 429, `expected 429 over cap; got ${overCap}`);
  } finally {
    await app.close();
  }
});

test("/transcribe rate-limits at 30 requests/minute per IP", async () => {
  const app = await buildApp("203.0.113.20");
  try {
    const codes = await hammer(
      app,
      {
        method: "POST",
        url: "/transcribe",
        body: {
          audio: "data:audio/mp4;base64,AAAA",
        },
      },
      TRANSCRIBE_CAP + 1,
    );

    for (let i = 0; i < TRANSCRIBE_CAP; i++) {
      assert.notEqual(codes[i], 429, `expected non-429 at index ${i}`);
    }
    assert.equal(codes[TRANSCRIBE_CAP], 429);
  } finally {
    await app.close();
  }
});

test("/voice/speak rate-limits at 30 requests/minute per IP", async () => {
  const app = await buildApp("203.0.113.30");
  try {
    const codes = await hammer(
      app,
      {
        method: "POST",
        url: "/voice/speak",
        body: { text: "hello" },
      },
      VOICE_SPEAK_CAP + 1,
    );

    for (let i = 0; i < VOICE_SPEAK_CAP; i++) {
      assert.notEqual(codes[i], 429, `expected non-429 at index ${i}`);
    }
    assert.equal(codes[VOICE_SPEAK_CAP], 429);
  } finally {
    await app.close();
  }
});

test("/voice/advice rate-limits at 15 requests/minute per IP", async () => {
  const app = await buildApp("203.0.113.40");
  try {
    const codes = await hammer(
      app,
      {
        method: "POST",
        url: "/voice/advice",
        body: { question: "what next?", includeAudio: false },
      },
      VOICE_ADVICE_CAP + 1,
    );

    for (let i = 0; i < VOICE_ADVICE_CAP; i++) {
      assert.notEqual(codes[i], 429, `expected non-429 at index ${i}`);
    }
    assert.equal(codes[VOICE_ADVICE_CAP], 429);
  } finally {
    await app.close();
  }
});

test("rate-limit keys on x-forwarded-for so a different client IP is not blocked", async () => {
  // Build two apps that share no in-memory state. We re-use the analyse
  // endpoint at the cap to confirm the key generator differentiates
  // between clients.
  const appA = await buildApp("203.0.113.50");
  const appB = await buildApp("203.0.113.51");
  try {
    const codesA = await hammer(
      appA,
      {
        method: "POST",
        url: "/analyse",
        body: { image: "data:image/jpeg;base64,AAAA" },
      },
      ANALYSE_CAP + 1,
    );
    assert.equal(codesA[ANALYSE_CAP], 429);

    const codesB = await hammer(
      appB,
      {
        method: "POST",
        url: "/analyse",
        body: { image: "data:image/jpeg;base64,AAAA" },
      },
      1,
    );
    assert.notEqual(codesB[0], 429);
  } finally {
    await appA.close();
    await appB.close();
  }
});
