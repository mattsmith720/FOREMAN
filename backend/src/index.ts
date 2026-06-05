import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerAnalyseRoutes } from "./routes/analyse.js";
import { registerSessionRoutes } from "./routes/sessions.js";
import { registerTranscribeRoutes } from "./routes/transcribe.js";

const app = Fastify({
  logger: true,
  bodyLimit: 15 * 1024 * 1024,
});

await app.register(cors, { origin: true });
app.get("/health", async () => ({ status: "ok" }));
await registerAnalyseRoutes(app);
await registerSessionRoutes(app);
await registerTranscribeRoutes(app);

const port = Number(process.env.PORT ?? 8080);

app.listen({ port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
