import "dotenv/config";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { assertProductionSecurity } from "./assert-production-security.js";
import { registerAuthHook } from "./auth.js";
import { getCorsOrigins, getListenPort } from "./config.js";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";

assertProductionSecurity();

const app = Fastify({
  logger: true,
  bodyLimit: 15 * 1024 * 1024,
  trustProxy: true,
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

app.get("/ready", async () => ({ status: "ok" }));

await registerAnalyseRoutes(app);
await registerSessionRoutes(app);
await registerTranscribeRoutes(app);

const port = getListenPort();

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
