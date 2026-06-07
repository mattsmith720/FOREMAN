import { coachingResponseSchema, type CoachingResponse } from "@foreman/shared";

/**
 * Offline coaching-quality rubrics. Pure functions over a CoachingResponse (+ the
 * scenario's expectation) — no API, deterministic, unit-tested. The eval runner
 * (scripts/eval-coaching.ts) aggregates a pass-rate per rubric across scenarios.
 *
 * A rubric returns null when it does not APPLY to a scenario (excluded from that
 * rubric's denominator) — so e.g. brevity only judges frames that actually speak.
 */

export interface ScenarioExpectation {
  /** Should the model SPEAK this frame? (no-firehose: false on calm/no-change frames) */
  speak?: boolean;
  /** A critical safety issue is present and must lead the spoken cue. */
  criticalSafety?: boolean;
  /** Keywords the coaching should specifically name (any match passes). */
  mustMention?: string[];
  /** A customer conversation is present; salesPitchFeedback must be non-empty. */
  pitchFeedback?: boolean;
}

export interface RubricResult {
  pass: boolean;
  detail: string;
}

export interface Rubric {
  key: string;
  label: string;
  score: (c: CoachingResponse, e: ScenarioExpectation) => RubricResult | null;
}

const MAX_SPOKEN_WORDS = 12;
const MAX_SPOKEN_CHARS = 120;

// Imperative leads we expect a spoken coaching line to start with. Lenient by
// design — the point is to catch passive/observational lines ("There is a..."),
// not to police phrasing.
const ACTION_VERBS = new Set([
  "clip", "check", "double-check", "recheck", "secure", "fasten", "anchor",
  "tie", "harness", "move", "shift", "reposition", "fix", "align", "straighten",
  "torque", "tighten", "loosen", "route", "run", "keep", "mind", "watch",
  "get", "grab", "ask", "offer", "mention", "confirm", "verify", "tidy",
  "clear", "cover", "flash", "seal", "isolate", "switch", "set", "adjust",
  "slow", "pause", "stop", "point", "show", "walk", "lead", "close", "follow",
  "hold", "lower", "raise", "wear", "put", "don", "brace", "support", "measure",
  "mark", "plan", "note", "capture", "photograph", "label", "log", "stay",
  "step", "mount", "fit", "space", "level", "centre", "drill", "bond", "earth",
  "test", "swap", "replace", "remove", "add", "bring", "lay", "drop", "lift",
  "wrap", "clamp", "trim", "cut", "drain", "leave", "avoid", "reduce", "increase",
  "wait", "highlight", "explain", "reassure", "listen", "acknowledge",
  "restart", "review", "introduce", "qualify", "document", "describe",
  "demonstrate", "share", "suggest", "recommend", "propose", "frame",
  "position", "reframe", "redirect", "refocus", "gauge", "probe", "open",
  "build", "gather", "present", "emphasise", "reset", "start", "begin",
  "slash", "mow", "energise", "energize", "inspect", "photograph", "snap",
  "label", "earth", "bond", "double", "reopen", "book", "schedule", "rebook",
  "quote", "flag", "stage", "coil", "bundle", "park", "summarise", "summarize",
  "recap",
]);

const MULTIWORD_LEADS = [
  /^make sure\b/i,
  /^don't\b/i,
  /^do not\b/i,
  /^be sure\b/i,
  /^take a\b/i,
  /^let'?s\b/i,
];

// Clearly-American spellings; AU English is required. Conservative list to avoid
// false positives on words that are valid in both (e.g. -ize is acceptable AU).
const US_SPELLINGS = [
  "color", "colors", "colored", "aluminum", "fiber", "fibers", "center",
  "centered", "centering", "behavior", "behaviors", "neighbor", "neighbors",
  "favor", "favorite", "harbor", "labeled", "traveling", "modeling",
];

// Generic filler that must NOT be the spoken line when a real issue is expected.
const GENERIC_LINES = [
  "looks good", "good job", "nice work", "keep going", "keep it up",
  "continue", "carry on", "well done", "all good", "looking good",
  "great work", "good work", "no issues",
];

function words(s: string): string[] {
  // Drop standalone punctuation tokens (e.g. an em-dash) so they don't inflate
  // the spoken-word count; only tokens containing a letter or digit count.
  return s
    .trim()
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w));
}

function firstWord(s: string): string {
  const w = words(s)[0] ?? "";
  return w.toLowerCase().replace(/^[^a-z']+/i, "").replace(/[^a-z'-]+$/i, "");
}

/** All free-text the coaching surfaced, for keyword / spelling scans. */
function allText(c: CoachingResponse): string {
  return [
    ...(c.observations ?? []),
    ...(c.installQualityFlags ?? []).map((f) => f.message),
    ...(c.salesPitchFeedback ?? []).map((f) => f.message),
    c.timeOnTaskNote ?? "",
    ...(c.nextSteps ?? []),
    ...(c.visualCallouts ?? []).flatMap((v) => [v.label, v.message]),
    c.spokenCue?.say ?? "",
  ].join(" \n ");
}

function hasCritical(c: CoachingResponse): boolean {
  return (
    (c.installQualityFlags ?? []).some((f) => f.severity === "critical") ||
    (c.visualCallouts ?? []).some(
      (v) => v.severity === "critical" && (v.category === "safety" || v.category === "damage"),
    )
  );
}

function isGeneric(say: string): boolean {
  const s = say.toLowerCase();
  return GENERIC_LINES.some((g) => s.includes(g));
}

export const RUBRICS: Rubric[] = [
  {
    key: "valid_shape",
    label: "Valid coaching JSON (schema)",
    score: (c) => {
      const ok = coachingResponseSchema.safeParse(c).success;
      return { pass: ok, detail: ok ? "valid" : "fails coachingResponseSchema" };
    },
  },
  {
    key: "no_firehose",
    label: "Speak gate matches expectation (no firehose)",
    score: (c, e) => {
      if (e.speak === undefined) return null;
      const speak = c.spokenCue?.speak === true;
      return {
        pass: speak === e.speak,
        detail: `expected speak=${e.speak}, got speak=${speak}`,
      };
    },
  },
  {
    key: "safety_first",
    label: "Safety-first ordering (a critical is never buried)",
    score: (c, e) => {
      const critical = hasCritical(c);
      if (!e.criticalSafety && !critical) return null; // rubric doesn't apply
      const cue = c.spokenCue;
      const spokenCritical =
        cue?.speak === true && cue.severity === "critical" && !isGeneric(cue.say);
      return {
        pass: spokenCritical,
        detail: spokenCritical
          ? "critical issue is the spoken line"
          : `critical present but spoken cue is ${
              cue ? `${cue.severity}/speak=${cue.speak}` : "absent"
            }`,
      };
    },
  },
  {
    key: "brevity",
    label: "Spoken line ≤12 words",
    score: (c) => {
      const say = c.spokenCue?.say;
      if (!say) return null;
      const n = words(say).length;
      return {
        pass: n <= MAX_SPOKEN_WORDS && say.length <= MAX_SPOKEN_CHARS,
        detail: `${n} words / ${say.length} chars: "${say}"`,
      };
    },
  },
  {
    key: "action_verb",
    label: "Spoken line leads with an action verb",
    score: (c) => {
      const cue = c.spokenCue;
      if (!cue || cue.speak !== true) return null; // only judge lines actually said
      const lead = firstWord(cue.say);
      const ok =
        ACTION_VERBS.has(lead) || MULTIWORD_LEADS.some((re) => re.test(cue.say));
      return { pass: ok, detail: `leads with "${lead}": "${cue.say}"` };
    },
  },
  {
    key: "australian_english",
    label: "Australian English (no US spellings)",
    score: (c) => {
      const text = allText(c).toLowerCase();
      const hits = US_SPELLINGS.filter((w) =>
        new RegExp(`\\b${w}\\b`).test(text),
      );
      return {
        pass: hits.length === 0,
        detail: hits.length ? `US spellings: ${hits.join(", ")}` : "clean",
      };
    },
  },
  {
    key: "specificity",
    label: "Names the actual issue (not generic)",
    score: (c, e) => {
      if (!e.mustMention || e.mustMention.length === 0) return null;
      const text = allText(c).toLowerCase();
      const matched = e.mustMention.filter((k) => text.includes(k.toLowerCase()));
      const cueGeneric =
        c.spokenCue?.speak === true && isGeneric(c.spokenCue.say);
      const pass = matched.length > 0 && !cueGeneric;
      return {
        pass,
        detail: cueGeneric
          ? "spoken cue is generic filler"
          : `matched [${matched.join(", ")}] of [${e.mustMention.join(", ")}]`,
      };
    },
  },
  {
    key: "pitch_critique",
    label: "Pitch feedback present when a conversation occurs",
    score: (c, e) => {
      if (!e.pitchFeedback) return null;
      const n = (c.salesPitchFeedback ?? []).length;
      return {
        pass: n >= 1,
        detail: `${n} salesPitchFeedback item(s)`,
      };
    },
  },
];

export interface ScenarioScore {
  id: string;
  results: Record<string, RubricResult | null>;
}

/** Score one scenario's coaching output against every rubric. */
export function scoreScenario(
  id: string,
  coaching: CoachingResponse,
  expect: ScenarioExpectation,
): ScenarioScore {
  const results: Record<string, RubricResult | null> = {};
  for (const r of RUBRICS) {
    results[r.key] = r.score(coaching, expect);
  }
  return { id, results };
}

export interface RubricRate {
  key: string;
  label: string;
  passed: number;
  applicable: number;
  rate: number | null;
}

/** Aggregate per-rubric pass-rates across scored scenarios. */
export function aggregate(scores: ScenarioScore[]): {
  perRubric: RubricRate[];
  overall: { passed: number; applicable: number; rate: number | null };
} {
  const perRubric: RubricRate[] = RUBRICS.map((r) => {
    let passed = 0;
    let applicable = 0;
    for (const s of scores) {
      const res = s.results[r.key];
      if (res === null || res === undefined) continue;
      applicable += 1;
      if (res.pass) passed += 1;
    }
    return {
      key: r.key,
      label: r.label,
      passed,
      applicable,
      rate: applicable === 0 ? null : passed / applicable,
    };
  });

  const passed = perRubric.reduce((a, r) => a + r.passed, 0);
  const applicable = perRubric.reduce((a, r) => a + r.applicable, 0);
  return {
    perRubric,
    overall: {
      passed,
      applicable,
      rate: applicable === 0 ? null : passed / applicable,
    },
  };
}
