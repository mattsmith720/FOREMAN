/** Public pricing model — AUD, ex GST. Illustrative until pilot contracts are signed. */

export const PRICING_CURRENCY = "AUD" as const;
export const PRICING_DISCLAIMER =
  "Illustrative pilot pricing in Australian dollars, excluding GST. Final quotes depend on crew size, job volume, and data retention. No charge until you accept a written pilot agreement.";

export type PricingTierId = "pilot" | "field" | "crew" | "enterprise";

export interface PricingTier {
  id: PricingTierId;
  name: string;
  tagline: string;
  priceLabel: string;
  priceNote: string;
  seatRange: string;
  cta: string;
  highlighted?: boolean;
  includes: string[];
  limits: string[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "pilot",
    name: "Pilot",
    tagline: "Prove value on real jobs before you scale seats",
    priceLabel: "$99",
    priceNote: "per active field tech / month · 90-day minimum",
    seatRange: "2–8 techs",
    cta: "Start a pilot",
    includes: [
      "Phone app — record, coach, end-of-job summary",
      "All maintenance job types (panel clean, pigeon proofing, thermal, etc.)",
      "Private session storage and coaching history",
      "Up to 40 completed jobs per org during pilot",
      "5 training module generations included",
      "Email support · onboarding call",
    ],
    limits: [
      "No SLA · best-effort API uptime",
      "90-day data retention default",
      "Ops dashboard read-only",
    ],
  },
  {
    id: "field",
    name: "Field",
    tagline: "Day-to-day coaching and training data for working crews",
    priceLabel: "$149",
    priceNote: "per active field tech / month · monthly or annual",
    seatRange: "1+ techs",
    cta: "Book a demo",
    highlighted: true,
    includes: [
      "Everything in Pilot, without job cap",
      "Unlimited completed jobs per seat",
      "12 training module generations / seat / month",
      "Dataset export (JSONL) for your model training",
      "Standard data retention (12 months)",
      "Business-hours support",
    ],
    limits: [
      "Fair use: ~200 coaching frames / job (typical visit well under this)",
      "Storage: 25 GB included per org, then metering",
    ],
  },
  {
    id: "crew",
    name: "Crew",
    tagline: "Fleet pricing when the whole team runs Foreman daily",
    priceLabel: "$127",
    priceNote: "per active field tech / month · 10+ seats · annual",
    seatRange: "10–40 techs",
    cta: "Talk to sales",
    includes: [
      "Everything in Field",
      "15% volume discount on per-seat rate (annual prepay)",
      "Ops dashboard — jobs, modules, issues caught",
      "Priority support · quarterly business review",
      "50 training module generations / org / month pooled",
      "Extended retention option (24 months)",
    ],
    limits: [
      "Annual commitment · billed quarterly or upfront",
      "Minimum 10 active seats",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Franchise, multi-branch, or white-label training pipeline",
    priceLabel: "Custom",
    priceNote: "platform fee + per-seat · 12-month agreement",
    seatRange: "40+ techs or multi-org",
    cta: "Contact us",
    includes: [
      "Everything in Crew",
      "Dedicated onboarding and prompt tuning for your SOPs",
      "Custom job types and coaching playbooks",
      "SSO and crew hierarchy (org → crew → installer)",
      "Whisper fine-tune export pipeline support",
      "Custom retention, DPA, and AU data residency review",
      "Named support contact · 99.5% API SLA target",
    ],
    limits: [
      "Scoped statement of work per rollout",
      "Professional services for ingest migration quoted separately",
    ],
  },
];

export interface MeteringLine {
  name: string;
  unit: string;
  included: string;
  overage: string;
  notes?: string;
}

export const METERING: MeteringLine[] = [
  {
    name: "Active field seat",
    unit: "tech with ≥1 job / billing month",
    included: "Per tier",
    overage: "N/A — add seats anytime",
    notes: "Crew leads and office viewers free on Crew+",
  },
  {
    name: "Completed job",
    unit: "session with ≥1 stored frame",
    included: "Unlimited on Field+",
    overage: "Pilot: hard cap 40 total",
  },
  {
    name: "Coaching frame",
    unit: "analysed still sent to API",
    included: "Fair use ~200 / job",
    overage: "$0.08 / frame above fair use",
    notes: "Rare in practice for maintenance visits",
  },
  {
    name: "Transcription",
    unit: "audio minute processed",
    included: "60 min / seat / month",
    overage: "$0.12 / minute",
  },
  {
    name: "Training module",
    unit: "AI-generated onboarding package",
    included: "Per tier allowance",
    overage: "$45 / module",
  },
  {
    name: "Storage",
    unit: "GB-month (frames + audio)",
    included: "25 GB org (Field)",
    overage: "$2.50 / GB-month",
  },
  {
    name: "Video ingest",
    unit: "gold-standard upload processed",
    included: "10 / org / month (Field)",
    overage: "$8 / video",
    notes: "Batch upload from camera roll for training library",
  },
];

export interface AddOn {
  name: string;
  price: string;
  description: string;
}

export const ADD_ONS: AddOn[] = [
  {
    name: "Training library kickstart",
    price: "$1,200 one-off",
    description:
      "We ingest and label up to 20 historical maintenance videos, run first dataset export, and deliver two ready-to-use onboarding modules.",
  },
  {
    name: "Whisper fine-tune prep",
    price: "$2,400 one-off",
    description:
      "Audio export, train/val split by session, baseline WER report, and handoff package for your fine-tune run (compute not included).",
  },
  {
    name: "Dedicated coaching playbook",
    price: "$800 / job type",
    description:
      "Custom prompt and coaching cues for one maintenance service (e.g. pigeon proofing) tuned on your gold-standard footage.",
  },
  {
    name: "Extended retention",
    price: "$0.40 / GB-month",
    description: "Keep raw frames and audio beyond standard retention for model training and audits.",
  },
];

export interface PricingFaq {
  q: string;
  a: string;
}

export const PRICING_FAQ: PricingFaq[] = [
  {
    q: "What counts as an active seat?",
    a: "A field tech who completes at least one Foreman job in the billing month. Office staff and crew leads using the ops dashboard do not count toward seat minimums on Crew and Enterprise.",
  },
  {
    q: "Is there a setup fee?",
    a: "Pilot has no setup fee. Field and Crew include a standard onboarding call. Enterprise and training-library kickstart may include professional services quoted in your agreement.",
  },
  {
    q: "Can we pause seats in the off-season?",
    a: "Yes on monthly Field plans — deactivate seats when techs are not in field. Annual Crew plans include a 10% seasonal seat bank (unused seats for up to 2 months without charge).",
  },
  {
    q: "Who pays for AI and API usage?",
    a: "Included allowances cover typical maintenance visits. Heavy ingest, excessive frame rates, or bulk module generation are metered transparently — see the usage table above.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Crew tier is annual-first with 15% off the Field per-seat rate. Enterprise negotiates multi-year commits. Pilot is monthly only.",
  },
];

/** Illustrative monthly total for calculator (ex GST). */
export function estimateMonthlyAud(
  tier: PricingTierId,
  seats: number,
  extraModules = 0,
): { subtotal: number; modules: number; total: number; perSeat: number } {
  const seat = Math.max(1, Math.floor(seats));
  let perSeat = 149;
  if (tier === "pilot") perSeat = 99;
  if (tier === "crew") perSeat = 127;
  if (tier === "enterprise") {
    return { subtotal: 0, modules: extraModules * 45, total: 0, perSeat: 0 };
  }

  const subtotal = perSeat * seat;
  const modules = extraModules * 45;
  return { subtotal, modules, total: subtotal + modules, perSeat };
}

export const VOLUME_BREAKS = [
  { seats: "1–9", field: "$149", crew: "—", note: "Field monthly" },
  { seats: "10–19", field: "$149", crew: "$127", note: "Crew annual · 15% off" },
  { seats: "20–39", field: "$149", crew: "$121", note: "Crew annual · 19% off" },
  { seats: "40+", field: "Custom", crew: "Custom", note: "Enterprise platform fee" },
] as const;
