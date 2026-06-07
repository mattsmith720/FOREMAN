import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { recordCueE2eMs } from "../metrics.js";

const cueE2eBodySchema = z.object({
  ms: z.number().finite().min(0).max(120_000),
});

/** Client-reported frame-captured → cue-audible latency (fire-and-forget). */
export async function registerMetricsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/metrics/cue-e2e", async (request, reply) => {
    const parsed = cueE2eBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid cue latency payload" });
    }
    recordCueE2eMs(parsed.data.ms);
    return reply.status(204).send();
  });
}
