/** Public pricing model — AUD, ex GST. Illustrative until pilot contracts are signed. */

export const PRICING_CURRENCY = "AUD" as const;
export const PRICING_DISCLAIMER =
  "Illustrative hybrid pricing in Australian dollars, excluding GST. You pay a fixed platform fee per active field tech plus metered usage for jobs and AI processing above bundled allowances. Final quotes depend on crew size, job volume, device count, and data retention. No charge until you accept a written pilot agreement.";

/** How fixed (seat) and variable (usage) components combine on the invoice. */
export const HYBRID_MODEL = {
  headline: "Per-seat platform fee + metered usage",
  lede:
    "Each active field tech has a monthly seat fee that covers the app and bundled allowances. Usage above those allowances — jobs, coaching frames, transcription, modules, and storage — is billed at the rates in the table below.",
  fixed: [
    {
      title: "Platform seat",
      body: "Monthly fee per tech who completes ≥1 job that month. Covers app access, job logging, coaching delivery, ops visibility, and baseline usage bundles.",
    },
    {
      title: "Hardware (optional)",
      body: "Meta glasses lease or purchase is a separate fixed line — not hidden inside software. Phone-only pilots pay software only.",
    },
  ],
  variable: [
    {
      title: "Completed jobs",
      body: "Each tier includes a number of completed jobs per seat. Additional jobs are charged per job at the tier rate.",
    },
    {
      title: "AI & data processing",
      body: "Coaching frames, transcription minutes, training modules, storage, and video ingest bill at published unit rates once bundled allowances are exhausted.",
    },
  ],
} as const;

export type PricingTierId = "pilot" | "field" | "crew" | "enterprise";

export interface TierUsageAllowances {
  jobsPerSeat: number | null;
  /** Pilot only — total org cap for the pilot period */
  jobsOrgCap?: number;
  framesFairUsePerJob: number;
  transcriptionMinPerSeat: number;
  modulesPerSeat: number;
  /** Crew — org-wide pooled module allowance / month */
  modulesOrgPool?: number;
  storageGbOrg: number;
  videoIngestOrg: number;
}

export const TIER_USAGE_ALLOWANCES: Record<
  Exclude<PricingTierId, "enterprise">,
  TierUsageAllowances
> = {
  pilot: {
    jobsPerSeat: null,
    jobsOrgCap: 40,
    framesFairUsePerJob: 150,
    transcriptionMinPerSeat: 30,
    modulesPerSeat: 0,
    storageGbOrg: 5,
    videoIngestOrg: 3,
  },
  field: {
    jobsPerSeat: 20,
    framesFairUsePerJob: 200,
    transcriptionMinPerSeat: 60,
    modulesPerSeat: 12,
    storageGbOrg: 25,
    videoIngestOrg: 10,
  },
  crew: {
    jobsPerSeat: 25,
    framesFairUsePerJob: 200,
    transcriptionMinPerSeat: 90,
    modulesPerSeat: 0,
    modulesOrgPool: 50,
    storageGbOrg: 50,
    videoIngestOrg: 20,
  },
};

export const USAGE_RATES = {
  jobOverage: { pilot: 5, field: 3.5, crew: 2.5 } as const,
  frameOverage: 0.08,
  transcriptionOverage: 0.12,
  moduleOverage: 45,
  storageOverage: 2.5,
  videoIngestOverage: 8,
} as const;

export interface UsageInputs {
  jobsPerMonth: number;
  avgFramesPerJob: number;
  transcriptionMinutes: number;
  extraModules: number;
  storageGb: number;
  videoIngest: number;
}

export interface UsageChargeLine {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface UsageChargeEstimate {
  lines: UsageChargeLine[];
  total: number;
}

/**
 * Meta Ray-Ban smart glasses — retail reference for TCO (Jun 2026).
 * Field crews use Gen 2 (camera + open-ear audio); Display ($799 USD) is not required.
 * @see https://www.meta.com/smart-glasses/ray-ban-meta/
 */
export const GLASSES_RETAIL = {
  model: "Ray-Ban Meta Gen 2",
  usdRetail: 379,
  audRetailStandard: 599,
  audRetailPrescription: 899,
  audRetailNote:
    "~US$379 Meta retail · AU$599 standard lenses · +$300 typical prescription add-on",
  leaseTermMonths: 24,
  replacementReservePct: 0.12,
} as const;

export type DeviceMode = "phone" | "byod_glasses" | "glasses_lease" | "glasses_buy";

export interface HardwareOption {
  id: DeviceMode;
  name: string;
  description: string;
  /** Recurring AUD / seat / month (0 for phone / BYOD). */
  monthlyPerSeat: (prescription: boolean) => number;
  /** One-time AUD / seat when applicable. */
  upfrontPerSeat: (prescription: boolean) => number;
}

export const HARDWARE_OPTIONS: HardwareOption[] = [
  {
    id: "phone",
    name: "Phone only",
    description:
      "Pilot and early Field rollout. Tech holds the phone or uses a chest mount. No wearable hardware from Foreman.",
    monthlyPerSeat: () => 0,
    upfrontPerSeat: () => 0,
  },
  {
    id: "byod_glasses",
    name: "Bring your own Meta glasses",
    description:
      "You purchase Ray-Ban Meta from Meta or a retailer. Foreman software only — same per-seat software rate.",
    monthlyPerSeat: () => 0,
    upfrontPerSeat: () => 0,
  },
  {
    id: "glasses_lease",
    name: "Meta glasses lease (via Foreman)",
    description:
      "24-month fleet lease incl. provisioning and replacement reserve. Standard or prescription frames quoted per tech.",
    monthlyPerSeat: (rx) => glassesLeaseMonthlyAud(rx),
    upfrontPerSeat: () => 0,
  },
  {
    id: "glasses_buy",
    name: "Meta glasses purchase (via Foreman)",
    description:
      "One-time device purchase + provisioning. Own the hardware outright; software billed separately.",
    monthlyPerSeat: () => 0,
    upfrontPerSeat: (rx) => (rx ? 949 : 649),
  },
];

/** Published bundle: Field/Crew software + glasses lease in one line for quoting. */
export const WEARABLE_BUNDLES = [
  {
    name: "Field hands-free",
    softwareTier: "Field" as const,
    softwarePerSeat: 149,
    hardwarePerSeat: glassesLeaseMonthlyAud(false),
    totalPerSeat: 149 + glassesLeaseMonthlyAud(false),
    note: "Field software + Meta Gen 2 lease · standard lenses",
  },
  {
    name: "Crew hands-free",
    softwareTier: "Crew" as const,
    softwarePerSeat: 127,
    hardwarePerSeat: glassesLeaseMonthlyAud(false),
    totalPerSeat: 127 + glassesLeaseMonthlyAud(false),
    note: "Crew annual software + Meta Gen 2 lease · standard lenses",
  },
] as const;

/** Published fleet lease rate (24-mo term, replacement reserve, provisioning). */
export function glassesLeaseMonthlyAud(prescription = false): number {
  // Derived from audRetail × 1.12 ÷ 24, rounded up to clean seat math ($29 / $42).
  return prescription ? 42 : 29;
}

/** Amortized monthly for buy-vs-lease TCO comparison (same 24-month window). */
export function glassesBuyAmortizedMonthlyAud(prescription = false): number {
  const upfront = prescription ? 949 : 649;
  return Math.round(upfront / GLASSES_RETAIL.leaseTermMonths);
}

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
    tagline: "Short trial on live jobs with a small crew",
    priceLabel: "$99",
    priceNote: "platform seat / month · + metered usage · 90-day minimum",
    seatRange: "2–8 techs",
    cta: "Book a pilot call",
    includes: [
      "Platform seat — phone app, coaching, end-of-job summary",
      "All maintenance job types (panel clean, pigeon proofing, thermal, etc.)",
      "40 completed jobs included (org total during pilot)",
      "30 transcription min / seat / month · 150 coaching frames / job fair use",
      "5 training module generations included (org total)",
      "Email support · onboarding call",
    ],
    limits: [
      "Jobs above 40 org cap: $5 / job",
      "Phone capture only — Meta glasses on Field+ (lease from $29/tech/mo)",
      "No SLA · best-effort API uptime · 90-day retention",
    ],
  },
  {
    id: "field",
    name: "Field",
    tagline: "Ongoing use for crews running jobs each week",
    priceLabel: "$149",
    priceNote: "platform seat / month · + metered jobs & AI usage",
    seatRange: "1+ techs",
    cta: "Request a quote",
    highlighted: true,
    includes: [
      "Platform seat — everything in Pilot without pilot job cap",
      "20 completed jobs / seat / month included",
      "60 transcription min / seat · 12 modules / seat / month",
      "200 coaching frames / job fair use · 25 GB storage / org",
      "Phone or Meta Ray-Ban Gen 2 capture (hardware optional)",
      "Dataset export (JSONL) · 12-month retention · business-hours support",
    ],
    limits: [
      "Extra jobs: $3.50 / job · frames above fair use: $0.08 / frame",
      "Transcription, modules, storage, ingest — metered beyond bundles",
    ],
  },
  {
    id: "crew",
    name: "Crew",
    tagline: "Annual pricing for 10 or more active techs",
    priceLabel: "$127",
    priceNote: "platform seat / month · + metered usage · 10+ seats annual",
    seatRange: "10–40 techs",
    cta: "Contact us",
    includes: [
      "Platform seat — everything in Field at 15% lower seat rate",
      "25 completed jobs / seat / month included",
      "90 transcription min / seat · 50 modules / org / month pooled",
      "50 GB storage / org · ops dashboard · priority support",
      "Quarterly business review · extended retention option (24 months)",
    ],
    limits: [
      "Extra jobs: $2.50 / job · annual commitment · min 10 seats",
      "AI & storage overages at Crew-tier published rates",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Franchise, multi-branch, or white-label training pipeline",
    priceLabel: "Custom",
    priceNote: "platform fee + per-seat + committed usage pools · 12-month agreement",
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
    name: "Platform seat (fixed)",
    unit: "active field tech / month",
    included: "Pilot $99 · Field $149 · Crew $127",
    overage: "Add seats anytime",
    notes: "Fixed monthly — office viewers free on Crew+",
  },
  {
    name: "Completed job",
    unit: "session with ≥1 stored frame",
    included: "Pilot 40 org · Field 20/seat · Crew 25/seat",
    overage: "Pilot $5 · Field $3.50 · Crew $2.50 / job",
    notes: "Hybrid meter — seat fee covers bundled pool",
  },
  {
    name: "Coaching frame",
    unit: "analysed still sent to API",
    included: "200 / job fair use (150 Pilot)",
    overage: "$0.08 / frame above fair use / job",
    notes: "Typical maintenance visit uses 40–80 frames",
  },
  {
    name: "Transcription",
    unit: "audio minute processed",
    included: "Pilot 30 · Field 60 · Crew 90 min / seat",
    overage: "$0.12 / minute",
  },
  {
    name: "Training module",
    unit: "AI-generated onboarding package",
    included: "Pilot 5 org · Field 12/seat · Crew 50 org pool",
    overage: "$45 / module",
  },
  {
    name: "Storage",
    unit: "GB-month (frames + audio)",
    included: "Pilot 5 · Field 25 · Crew 50 GB / org",
    overage: "$2.50 / GB-month",
  },
  {
    name: "Video ingest",
    unit: "reference video upload processed",
    included: "Pilot 3 · Field 10 · Crew 20 / org",
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
    name: "Meta glasses — fleet lease",
    price: `From $${glassesLeaseMonthlyAud(false)}/seat/mo (24 mo)`,
    description:
      "Ray-Ban Meta Gen 2 leased and provisioned per tech. Standard lenses from $29/seat/month; prescription frames from $42/seat/month. Includes replacement reserve — damaged or lost units swapped per agreement.",
  },
  {
    name: "Meta glasses — outright purchase",
    price: "$649 / seat (standard) · $949 (prescription)",
    description:
      "One-time purchase through Foreman at retail-plus-provisioning. You own the device; software stays on the per-seat plan. Typical useful life 24–36 months on daily field use.",
  },
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
      "Custom prompt and coaching cues for one maintenance service (e.g. pigeon proofing), tuned on your reference job footage.",
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
    q: "How does hybrid billing work?",
    a: "Your invoice has two parts: a fixed platform fee per active field tech each month, plus a variable usage section for jobs, AI frames, transcription, modules, and storage above the bundled allowances for your tier. Quiet months with fewer jobs cost less on the usage line.",
  },
  {
    q: "Who pays for AI and API usage?",
    a: "Bundled allowances cover typical maintenance visits. Usage beyond those amounts is charged at the published unit rates. See the usage table and calculator above.",
  },
  {
    q: "Do you offer annual discounts?",
    a: "Crew tier is annual-first with 15% off the Field per-seat rate. Enterprise negotiates multi-year commits. Pilot is monthly only.",
  },
  {
    q: "How much do Meta glasses cost?",
    a: "Ray-Ban Meta Gen 2 retails around AU$599 (standard lenses) or ~AU$899 with prescription — sourced from Meta's US$379 base price plus typical lens add-ons. Through Foreman you can lease from $29/seat/month over 24 months, buy outright ($649 standard / $949 prescription), or bring your own pair and pay software only.",
  },
  {
    q: "Should we budget for glasses on every tech?",
    a: "Not on Pilot — phone-only is fine to prove coaching and modules. For Field and Crew, budget one wearable per active roof tech when you want hands-free capture. Crew leads and office viewers stay on phone or dashboard; they don't need glasses seats.",
  },
  {
    q: "What if a tech breaks or loses a leased pair?",
    a: "The lease rate includes a replacement reserve. First incident per seat per year is covered; repeated loss may incur a deductible quoted in your fleet agreement.",
  },
];

export interface MonthlyEstimate {
  perSeatSoftware: number;
  perSeatHardware: number;
  subtotalFixed: number;
  subtotalHardware: number;
  usage: UsageChargeEstimate;
  total: number;
  upfrontHardware: number;
  /** 24-month TCO / seat for buy comparison */
  tcoPerSeat24Mo: number;
}

const DEFAULT_USAGE: UsageInputs = {
  jobsPerMonth: 80,
  avgFramesPerJob: 60,
  transcriptionMinutes: 180,
  extraModules: 0,
  storageGb: 25,
  videoIngest: 2,
};

/** Variable usage charges above tier allowances (ex GST). */
export function estimateUsageCharges(
  tier: PricingTierId,
  seats: number,
  usage: UsageInputs = DEFAULT_USAGE,
): UsageChargeEstimate {
  if (tier === "enterprise") {
    return { lines: [], total: 0 };
  }

  const seat = Math.max(1, Math.floor(seats));
  const allowances = TIER_USAGE_ALLOWANCES[tier];
  const lines: UsageChargeLine[] = [];

  const jobs = Math.max(0, Math.floor(usage.jobsPerMonth));
  const framesPerJob = Math.max(0, usage.avgFramesPerJob);

  let includedJobs = 0;
  if (tier === "pilot" && allowances.jobsOrgCap != null) {
    includedJobs = allowances.jobsOrgCap;
  } else if (allowances.jobsPerSeat != null) {
    includedJobs = allowances.jobsPerSeat * seat;
  }

  const extraJobs = Math.max(0, jobs - includedJobs);
  if (extraJobs > 0) {
    const rate = USAGE_RATES.jobOverage[tier];
    lines.push({
      id: "jobs",
      label: "Completed jobs (overage)",
      quantity: extraJobs,
      unit: "job",
      rate,
      amount: extraJobs * rate,
    });
  }

  if (framesPerJob > allowances.framesFairUsePerJob && jobs > 0) {
    const overFramesPerJob = framesPerJob - allowances.framesFairUsePerJob;
    const quantity = Math.round(overFramesPerJob * jobs);
    lines.push({
      id: "frames",
      label: "Coaching frames (above fair use)",
      quantity,
      unit: "frame",
      rate: USAGE_RATES.frameOverage,
      amount: quantity * USAGE_RATES.frameOverage,
    });
  }

  const includedTranscription = allowances.transcriptionMinPerSeat * seat;
  const extraTranscription = Math.max(0, usage.transcriptionMinutes - includedTranscription);
  if (extraTranscription > 0) {
    lines.push({
      id: "transcription",
      label: "Transcription (overage)",
      quantity: extraTranscription,
      unit: "min",
      rate: USAGE_RATES.transcriptionOverage,
      amount: extraTranscription * USAGE_RATES.transcriptionOverage,
    });
  }

  let includedModules = 0;
  if (tier === "pilot") {
    includedModules = 5;
  } else if (allowances.modulesOrgPool != null) {
    includedModules = allowances.modulesOrgPool;
  } else {
    includedModules = allowances.modulesPerSeat * seat;
  }

  const totalModules = usage.extraModules;
  const extraModules = Math.max(0, totalModules - includedModules);
  if (extraModules > 0) {
    lines.push({
      id: "modules",
      label: "Training modules (overage)",
      quantity: extraModules,
      unit: "module",
      rate: USAGE_RATES.moduleOverage,
      amount: extraModules * USAGE_RATES.moduleOverage,
    });
  }

  const extraStorage = Math.max(0, usage.storageGb - allowances.storageGbOrg);
  if (extraStorage > 0) {
    lines.push({
      id: "storage",
      label: "Storage (overage)",
      quantity: extraStorage,
      unit: "GB",
      rate: USAGE_RATES.storageOverage,
      amount: extraStorage * USAGE_RATES.storageOverage,
    });
  }

  const extraIngest = Math.max(0, usage.videoIngest - allowances.videoIngestOrg);
  if (extraIngest > 0) {
    lines.push({
      id: "ingest",
      label: "Video ingest (overage)",
      quantity: extraIngest,
      unit: "video",
      rate: USAGE_RATES.videoIngestOverage,
      amount: extraIngest * USAGE_RATES.videoIngestOverage,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines, total: Math.round(total * 100) / 100 };
}

/** Illustrative monthly total for calculator (ex GST). */
export function estimateMonthlyAud(
  tier: PricingTierId,
  seats: number,
  usage: UsageInputs = DEFAULT_USAGE,
  device: DeviceMode = "phone",
  prescription = false,
): MonthlyEstimate {
  const seat = Math.max(1, Math.floor(seats));
  let perSeatSoftware = 149;
  if (tier === "pilot") perSeatSoftware = 99;
  if (tier === "crew") perSeatSoftware = 127;
  if (tier === "enterprise") {
    return {
      perSeatSoftware: 0,
      perSeatHardware: 0,
      subtotalFixed: 0,
      subtotalHardware: 0,
      usage: estimateUsageCharges(tier, seat, usage),
      total: 0,
      upfrontHardware: 0,
      tcoPerSeat24Mo: 0,
    };
  }

  const hw = HARDWARE_OPTIONS.find((o) => o.id === device) ?? HARDWARE_OPTIONS[0];
  const perSeatHardware = hw.monthlyPerSeat(prescription);
  const upfrontPerSeat = hw.upfrontPerSeat(prescription);
  const subtotalFixed = perSeatSoftware * seat;
  const subtotalHardware = perSeatHardware * seat;
  const usageEstimate = estimateUsageCharges(tier, seat, usage);
  const upfrontHardware = upfrontPerSeat * seat;
  const total = subtotalFixed + subtotalHardware + usageEstimate.total;
  const tcoPerSeat24Mo =
    perSeatSoftware * 24 +
    (device === "glasses_buy" ? upfrontPerSeat : perSeatHardware * 24);

  return {
    perSeatSoftware,
    perSeatHardware,
    subtotalFixed,
    subtotalHardware,
    usage: usageEstimate,
    total,
    upfrontHardware,
    tcoPerSeat24Mo,
  };
}

export const VOLUME_BREAKS = [
  { seats: "1–9", field: "$149", crew: "—", note: "Field monthly" },
  { seats: "10–19", field: "$149", crew: "$127", note: "Crew annual · 15% off" },
  { seats: "20–39", field: "$149", crew: "$121", note: "Crew annual · 19% off" },
  { seats: "40+", field: "Custom", crew: "Custom", note: "Enterprise platform fee" },
] as const;
