import "dotenv/config";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { registerAuthHook } from "./auth.js";
import {
  getCorsOrigins,
  getListenPort,
  isAnalysisConfigured,
  isTranscriptionConfigured,
} from "./config.js";
import { isSupabaseConfigured } from "./db/supabase.js";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";

const app = Fastify({
  logger: true,
  bodyLimit: 15 * 1024 * 1024,
});

await app.register(helmet, {
  contentSecurityPolicy: false,
});

await app.register(cors, {
  origin: getCorsOrigins(),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-foreman-api-key"],
});

await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
});

await registerAuthHook(app);

app.get("/health", async () => ({ status: "ok" }));

app.get("/ready", async () => ({
  status: "ok",
  services: {
    anthropic: isAnalysisConfigured(),
    openai: isTranscriptionConfigured(),
    supabase: isSupabaseConfigured(),
  },
}));

await registerAnalyseRoutes(app);
await registerSessionRoutes(app);
await registerTranscribeRoutes(app);

const port = getListenPort();

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
