import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isApiKeyRequired } from "./config.js";

const API_KEY_HEADER = "x-foreman-api-key";

export async function registerAuthHook(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url === "/health" || request.url === "/ready") {
      return;
    }

    const requiredKey = process.env.FOREMAN_API_KEY?.trim();
    if (!requiredKey) {
      return;
    }

    const provided = request.headers[API_KEY_HEADER];
    const key = Array.isArray(provided) ? provided[0] : provided;

    if (key !== requiredKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}

export { API_KEY_HEADER, isApiKeyRequired };
