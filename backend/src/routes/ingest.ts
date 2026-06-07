import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import {
  createSignedVideoUpload,
  createSiteVideo,
  getSiteVideo,
  updateSiteVideo,
  VIDEOS_BUCKET,
} from "../db/site-videos.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  isVideoProcessingAvailable,
  processSiteVideo,
} from "../process-site-video.js";

const WEBHOOK_HEADER = "x-ingest-webhook-secret";

const initUploadSchema = z.object({
  worker: z.string().max(200).optional(),
  jobType: z.string().max(200).optional(),
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  byteSize: z.number().int().positive().max(524_288_000).optional(),
});

const driveWebhookSchema = z.object({
  fileId: z.string().min(1).max(200),
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(100),
  byteSize: z.number().int().positive().optional(),
  worker: z.string().max(200).optional(),
  jobType: z.string().max(200).optional(),
  downloadUrl: z.string().url().optional(),
});

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

const ALLOWED_DRIVE_HOSTS =
  /(^|\.)(googleapis\.com|drive\.google\.com|googleusercontent\.com)$/i;

function isAllowedDriveUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && ALLOWED_DRIVE_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

function ingestWebhookAuthorized(request: {
  headers: Record<string, unknown>;
}): boolean {
  const expected = process.env.INGEST_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const provided = request.headers[WEBHOOK_HEADER];
  const secret = Array.isArray(provided) ? provided[0] : provided;
  return typeof secret === "string" && safeEqual(secret, expected);
}

function storageRefForUpload(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
  const stamp = Date.now();
  return `uploads/${stamp}-${safeName}`;
}

export async function registerIngestRoutes(app: FastifyInstance): Promise<void> {
  app.post("/ingest/videos/init", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }

    const parsed = initUploadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }

    try {
      const storageRef = storageRefForUpload(parsed.data.fileName);
      const signed = await createSignedVideoUpload(storageRef);
      const row = await createSiteVideo({
        worker: parsed.data.worker,
        jobType: parsed.data.jobType,
        storageRef,
        mimeType: parsed.data.mimeType,
        fileName: parsed.data.fileName,
        byteSize: parsed.data.byteSize,
        source: "upload",
      });

      return reply.send({
        videoId: row.id,
        bucket: VIDEOS_BUCKET,
        storageRef,
        signedUrl: signed.signedUrl,
        token: signed.token,
      });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Upload init failed");
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.post("/ingest/videos/:id/complete", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }

    const id = (request.params as { id?: string }).id;
    if (!id) {
      return reply.status(400).send({ error: "Missing video id" });
    }

    const row = await getSiteVideo(id);
    if (!row) {
      return reply.status(404).send({ error: "Video not found" });
    }

    const canProcessNow = await isVideoProcessingAvailable();
    if (canProcessNow) {
      void processSiteVideo(id)
        .then((processed) => {
          request.log.info(
            { videoId: id, status: processed.status },
            "site video processed",
          );
        })
        .catch((err) => {
          request.log.error(err, "site video processing failed");
        });
    }

    return reply.send({
      videoId: id,
      status: canProcessNow ? "processing" : "pending",
      message: canProcessNow
        ? "Upload received. Processing in background."
        : "Upload received. Run npm run process-videos on a machine with ffmpeg.",
    });
  });

  app.get("/ingest/videos/:id", async (request, reply) => {
    const id = (request.params as { id?: string }).id;
    if (!id) {
      return reply.status(400).send({ error: "Missing video id" });
    }

    const row = await getSiteVideo(id);
    if (!row) {
      return reply.status(404).send({ error: "Video not found" });
    }

    return reply.send({
      id: row.id,
      status: row.status,
      sessionId: row.session_id,
      framesExtracted: row.frames_extracted,
      error: row.error_message,
      uploadedAt: row.uploaded_at,
      processedAt: row.processed_at,
    });
  });

  app.post("/ingest/drive-webhook", async (request, reply) => {
    if (!ingestWebhookAuthorized(request)) {
      return reply.status(401).send({ error: "Unauthorized webhook" });
    }

    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }

    const parsed = driveWebhookSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid webhook payload" });
    }

    try {
      const storageRef = `drive/${parsed.data.fileId}/${parsed.data.fileName.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
      const row = await createSiteVideo({
        worker: parsed.data.worker,
        jobType: parsed.data.jobType,
        source: "google_drive",
        externalId: parsed.data.fileId,
        storageRef,
        mimeType: parsed.data.mimeType,
        fileName: parsed.data.fileName,
        byteSize: parsed.data.byteSize,
        metadata: {
          downloadUrl: parsed.data.downloadUrl ?? null,
        },
      });

      if (parsed.data.downloadUrl) {
        // SSRF guard: only fetch from known Google Drive hosts over https.
        if (!isAllowedDriveUrl(parsed.data.downloadUrl)) {
          return reply.status(400).send({
            error: "downloadUrl host is not an allowed Google Drive host",
          });
        }
        const { getSupabase } = await import("../db/supabase.js");
        const supabase = getSupabase();
        const response = await fetch(parsed.data.downloadUrl);
        if (!response.ok) {
          throw new Error(`Drive download failed (${response.status})`);
        }
        const bytes = Buffer.from(await response.arrayBuffer());
        const upload = await supabase.storage
          .from(VIDEOS_BUCKET)
          .upload(storageRef, bytes, {
            contentType: parsed.data.mimeType,
            upsert: true,
          });
        if (upload.error) {
          throw new Error(upload.error.message);
        }

        void processSiteVideo(row.id).catch((err) => {
          request.log.error(err, "drive video processing failed");
        });
      }

      return reply.send({
        videoId: row.id,
        status: parsed.data.downloadUrl ? "processing" : "pending",
      });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Drive ingest failed");
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.post("/ingest/process-pending", async (request, reply) => {
    if (!ingestWebhookAuthorized(request)) {
      return reply.status(401).send({ error: "Unauthorized webhook" });
    }

    const { listPendingSiteVideos } = await import("../db/site-videos.js");
    const pending = await listPendingSiteVideos(10);
    const results: Array<{ id: string; status: string }> = [];

    for (const video of pending) {
      try {
        const processed = await processSiteVideo(video.id);
        results.push({ id: processed.id, status: processed.status });
      } catch (err) {
        const message = err instanceof Error ? err.message : "failed";
        await updateSiteVideo(video.id, {
          status: "failed",
          error_message: message,
        });
        results.push({ id: video.id, status: "failed" });
      }
    }

    return reply.send({ processed: results.length, results });
  });
}

export { WEBHOOK_HEADER };
