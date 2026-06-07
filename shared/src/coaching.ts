import { z } from "zod";

/**
 * The coaching schema. This is the contract for what the backend's analysis call must
 * return for a single frame — JSON only, validated with zod before it is trusted or stored.
 * Both the backend and the clients import these types so the shape never drifts.
 *
 * Mirrors the coaching_events fields in the data model (see CLAUDE.md).
 */

/** What kind of coaching a message represents. */
export const coachingCategory = z.enum(["pitch", "quality", "time", "safety"]);

/** How urgent a coaching message is. */
export const coachingSeverity = z.enum(["info", "warning", "critical"]);

/** A single coaching cue produced from one analysed frame. */
export const coachingEventSchema = z.object({
  category: coachingCategory,
  severity: coachingSeverity,
  message: z.string().min(1),
});

export const installQualityFlagSchema = z.object({
  message: z.string().min(1),
  severity: coachingSeverity,
});

export const salesPitchFeedbackSchema = z.object({
  message: z.string().min(1),
  severity: coachingSeverity,
});

/** What a on-frame highlight represents. */
export const visualCalloutCategory = z.enum([
  "quality",
  "safety",
  "pitch",
  "upsell",
  "cleanliness",
  "damage",
  "time",
]);

/**
 * A region the coach wants the worker to look at.
 * x/y are normalized center coordinates (0–1) relative to the captured frame.
 */
export const visualCalloutSchema = z.object({
  id: z.string().min(1).max(40).optional(),
  label: z.string().min(1).max(80),
  message: z.string().min(1),
  category: visualCalloutCategory,
  severity: coachingSeverity,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0.05).max(0.95).optional(),
  h: z.number().min(0.05).max(0.95).optional(),
  shape: z.enum(["circle", "box", "pointer"]).default("circle"),
});

/** The full structured response the model must return for one frame. */
export const coachingResponseSchema = z.object({
  /** Short reads of what the worker is doing right now. */
  observations: z.array(z.string().min(1)),
  /** Install quality issues or confirmations visible in the frame. */
  installQualityFlags: z.array(installQualityFlagSchema),
  /** Sales pitch coaching when a customer interaction is visible or implied. */
  salesPitchFeedback: z.array(salesPitchFeedbackSchema),
  /** Brief note on time on task or pacing. */
  timeOnTaskNote: z.string(),
  /** Concrete next steps the worker should take before the next frame. */
  nextSteps: z.array(z.string().min(1)),
  /** On-frame highlights — circles/boxes pointing at issues or opportunities. */
  visualCallouts: z.array(visualCalloutSchema).default([]),
  /**
   * Ear-first: the single line to SAY this frame for a hands-free worker on
   * glasses. `speak` is false on most frames so coaching isn't a firehose.
   */
  spokenCue: z
    .object({
      say: z.string().min(1).max(200),
      severity: coachingSeverity,
      speak: z.boolean(),
    })
    .optional(),
});

export type CoachingCategory = z.infer<typeof coachingCategory>;
export type CoachingSeverity = z.infer<typeof coachingSeverity>;
export type CoachingEvent = z.infer<typeof coachingEventSchema>;
export type InstallQualityFlag = z.infer<typeof installQualityFlagSchema>;
export type SalesPitchFeedback = z.infer<typeof salesPitchFeedbackSchema>;
export type VisualCalloutCategory = z.infer<typeof visualCalloutCategory>;
export type VisualCallout = z.infer<typeof visualCalloutSchema>;
export type CoachingResponse = z.infer<typeof coachingResponseSchema>;
