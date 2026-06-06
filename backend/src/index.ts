import "dotenv/config";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { assertProductionSecurity } from "./assert-production-security.js";
import { registerAuthHook } from "./auth.js";
import { getCorsOrigins, getListenPort } from "./config.js";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerLabelRoutes } from "./routes/labels.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";
import { registerVoiceRoutes } from "./routes/voice.js";
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
  allowedHeaders: ["Content-Type", "x-foreman-api-key", "x-session-token"],
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

const port = getListenPort();

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
