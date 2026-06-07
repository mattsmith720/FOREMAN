import type { ScenarioExpectation } from "./rubrics.js";

/**
 * Fixture coaching scenarios for the offline eval harness, one set per phase.
 *
 * Pitch scenarios are TRANSCRIPT-driven — the "issue" lives in the spoken text,
 * so they exercise the rubrics fairly regardless of the still frame. Install /
 * survey scenarios use real roof imagery to exercise the format rubrics (brevity,
 * action-verb, AU English, JSON, no-firehose) on live outputs.
 *
 * To strengthen image-grounded DETECTION (does it catch a missing harness, a
 * cracked panel, a missing isolator), drop real labelled frames into
 * backend/eval/frames/ and add scenarios with `criticalSafety` / `mustMention`
 * visual expectations — those come from real pilot footage (the data flywheel).
 */
export interface EvalScenario {
  id: string;
  phase: "site_survey" | "solar_install" | "customer_pitch";
  description: string;
  /** Image path relative to the backend/ working dir. */
  frame: string;
  recentTranscript?: string[];
  expect: ScenarioExpectation;
}

const ROOF = "sample/roof.jpg";
const GENERIC = "../scripts/smoke-fixtures/frame.jpg";

export const SCENARIOS: EvalScenario[] = [
  {
    id: "pitch-weak",
    phase: "customer_pitch",
    description: "Door knock: vague, low-energy pitch with no value framing.",
    frame: GENERIC,
    recentTranscript: [
      "Uh hi, yeah we're doing solar in the area.",
      "It's pretty good, you'd save some money I reckon.",
      "Do you want to maybe think about it?",
    ],
    expect: {
      speak: true,
      pitchFeedback: true,
      mustMention: [
        "saving", "savings", "payback", "bill", "warranty", "value", "benefit",
      ],
    },
  },
  {
    id: "pitch-pushy",
    phase: "customer_pitch",
    description: "Pushy pitch that talks over the customer and ignores objections.",
    frame: GENERIC,
    recentTranscript: [
      "Look, everyone on this street is getting it, you don't want to miss out.",
      "Don't worry about the details, just sign here today and it's sorted.",
    ],
    expect: {
      speak: true,
      pitchFeedback: true,
      mustMention: [
        "listen", "question", "rapport", "objection", "need", "hear", "pressure",
      ],
    },
  },
  {
    id: "pitch-warm-close",
    phase: "customer_pitch",
    description: "Reasonable pitch with rapport; coach should refine, not rewrite.",
    frame: GENERIC,
    recentTranscript: [
      "Thanks for your time — based on your last bill you're paying about $400 a quarter.",
      "With this system most homes like yours pay that back in around five years.",
      "Happy to leave the warranty details with you — what questions can I answer?",
    ],
    expect: {
      pitchFeedback: true,
    },
  },
  {
    id: "survey-roof",
    phase: "site_survey",
    description:
      "Survey of a roof / array on real imagery — format + AU-English coverage.",
    frame: ROOF,
    expect: {},
  },
  {
    id: "install-roof",
    phase: "solar_install",
    description: "On-roof install frame — exercises format rubrics on real imagery.",
    frame: ROOF,
    expect: {},
  },
  {
    id: "install-generic",
    phase: "solar_install",
    description: "Generic install frame — format-rubric coverage.",
    frame: GENERIC,
    expect: {},
  },

  // --- CER install-defect DETECTION scenarios (S1) ---
  // The 5 highest-value, most-CER-failed defects. Each is skipped until a real
  // photo exists at its frame path (backend/eval/frames/...); drop one in — e.g.
  // from a mock switchboard or real pilot footage — to activate detection scoring.
  {
    id: "cer-no-shutdown-label",
    phase: "solar_install",
    description: "Main switchboard missing the emergency shutdown-procedure label.",
    frame: "eval/frames/switchboard-no-shutdown-label.jpg",
    expect: {
      speak: true,
      mustMention: ["shutdown", "switchboard", "label", "procedure"],
    },
  },
  {
    id: "cer-dc-not-in-conduit",
    phase: "solar_install",
    description: "Exposed DC cable run not in conduit on the roof or wall.",
    frame: "eval/frames/dc-not-in-conduit.jpg",
    expect: {
      speak: true,
      mustMention: ["conduit", "dc", "cable", "exposed"],
    },
  },
  {
    id: "cer-isolator-unlabelled",
    phase: "solar_install",
    description: "DC isolator missing or unlabelled.",
    frame: "eval/frames/isolator-unlabelled.jpg",
    expect: {
      speak: true,
      mustMention: ["isolator", "label", "dc", "signage"],
    },
  },
  {
    id: "cer-missing-signage",
    phase: "solar_install",
    description: "Missing 'Solar Supply Main Switch' / system-rating signage.",
    frame: "eval/frames/missing-signage.jpg",
    expect: {
      speak: true,
      mustMention: ["signage", "label", "switch", "main"],
    },
  },
  {
    id: "cer-serial-capture",
    phase: "solar_install",
    description:
      "Inverter/panel serial or compliance plate visible — capture for REC match.",
    frame: "eval/frames/serial-plate.jpg",
    expect: {
      mustMention: ["serial", "rec", "registry", "plate", "photo"],
    },
  },
];
