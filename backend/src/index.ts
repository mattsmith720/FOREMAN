import "dotenv/config";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { assertProductionSecurity } from "./assert-production-security.js";
import { registerAuthHook } from "./auth.js";
import {
  getAnalyseFrameByteCap,
  getCorsOrigins,
  getListenPort,
} from "./config.js";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerLabelRoutes } from "./routes/labels.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";
import { registerVoiceRoutes } from "./routes/voice.js";
import { registerIngestRoutes } from "./routes/ingest.js";
import { registerReadyRoute } from "./routes/ready.js";

assertProductionSecurity();

function hasPinoPretty(): boolean {
  const require = createRequire(import.meta.url);
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

function getLoggerConfig() {
  if (process.env.NODE_ENV === "production") {
    return { level: "info" };
  }

  if (hasPinoPretty()) {
    return {
      level: "info",
      transport: {
        target: "pino-pretty",
      },
    };
  }

  return true;
}

function getDataUrlBase64Payload(dataUrl: string): string | undefined {
  if (!dataUrl.startsWith("data:")) {
    return undefined;
  }

  const marker = ";base64,";
  const markerIndex = dataUrl.indexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }

  return dataUrl.slice(markerIndex + marker.length);
}

const app = Fastify({
  logger: getLoggerConfig(),
  bodyLimit: 15 * 1024 * 1024,
  trustProxy: true,
  genReqId: () => randomUUID(),
});

app.addHook("onRequest", async (request, reply) => {
  reply.header("x-request-id", request.id);
});

app.addHook("onResponse", async (request, reply) => {
  if (reply.statusCode >= 500) {
    request.log.error(
      { reqId: request.id, statusCode: reply.statusCode },
      "request completed with server error",
    );
  }
});

// Per-route rate limits are declared on each route's own `config.rateLimit`
// (routes/analyse.ts, transcribe.ts, voice.ts) so the caps documented in
// SECURITY.md are the single source of truth and stay in sync with the
// rate-limit integration tests. Do NOT re-add a blanket onRoute hook here —
// it silently overrides those per-route caps.

app.addHook("preValidation", async (request, reply) => {
  if (request.method !== "POST" || request.routeOptions?.url !== "/analyse") {
    return;
  }

  if (!request.headers["content-type"]?.includes("application/json")) {
    return;
  }

  const body = request.body;
  if (!body || typeof body !== "object") {
    return;
  }

  const image = (body as { image?: unknown }).image;
  if (typeof image !== "string") {
    return;
  }

  const payload = getDataUrlBase64Payload(image);
  if (!payload) {
    return;
  }

  const payloadBytes = Buffer.byteLength(payload, "utf8");
  const maxBytes = getAnalyseFrameByteCap();
  if (payloadBytes <= maxBytes) {
    return;
  }

  return reply.status(413).send({
    error: `Image payload exceeds ANALYSE_FRAME_MAX_BYTES (${maxBytes} bytes)`,
  });
});

app.setErrorHandler((err, request, reply) => {
  const maybeStatusCode =
    typeof err === "object" && err !== null && "statusCode" in err
      ? (err as { statusCode?: unknown }).statusCode
      : undefined;
  const statusCode =
    typeof maybeStatusCode === "number" && maybeStatusCode >= 400
      ? maybeStatusCode
      : 500;
  const message = err instanceof Error ? err.message : "Unexpected error";

  if (statusCode >= 500) {
    request.log.error({ reqId: request.id, err }, "request failed");
  }

  reply.status(statusCode).send({
    error: statusCode >= 500 ? "Internal Server Error" : message,
  });
});

await app.register(helmet, {
  contentSecurityPolicy: false,
});

await app.register(cors, {
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "x-foreman-api-key",
    "x-session-token",
    "x-ingest-webhook-secret",
  ],
});

await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
  keyGenerator: (request) =>
    request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ??
    request.ip,
});

await registerAuthHook(app);

app.get("/health", async () => ({ status: "ok" }));

await registerReadyRoute(app);

await registerAnalyseRoutes(app);
await registerSessionRoutes(app);
await registerTranscribeRoutes(app);
await registerLabelRoutes(app);
await registerVoiceRoutes(app);
await registerIngestRoutes(app);

const port = getListenPort();

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
