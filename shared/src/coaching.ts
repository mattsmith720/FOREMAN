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
});

export type CoachingCategory = z.infer<typeof coachingCategory>;
export type CoachingSeverity = z.infer<typeof coachingSeverity>;
export type CoachingEvent = z.infer<typeof coachingEventSchema>;
export type InstallQualityFlag = z.infer<typeof installQualityFlagSchema>;
export type SalesPitchFeedback = z.infer<typeof salesPitchFeedbackSchema>;
export type CoachingResponse = z.infer<typeof coachingResponseSchema>;
