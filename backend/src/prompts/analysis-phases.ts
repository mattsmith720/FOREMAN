export type AnalysisPhase =
  | "panel_clean"
  | "pigeon_proofing"
  | "thermal_scan"
  | "exterior_clean"
  | "commercial_clean"
  | "site_survey"
  | "solar_install"
  | "customer_pitch";

const MAINTENANCE_GUIDANCE = `Phase: SOLAR MAINTENANCE — the worker is servicing an existing array (cleaning, proofing, inspection, or exterior work). Prioritise SAFETY FIRST:
- Fall protection, harness/anchor use, ladder placement, and edge awareness on live roofs
- Working safely around energised equipment (no exposed conductor contact, isolation awareness)
Then workmanship and documentation:
- Technique for the visible task (clean coverage, mesh gaps, nest debris, thermal capture angles)
- Before/after evidence: array condition, problem areas fixed, customer-visible finish
- Customer handover cues when someone is on site (explain what was done, guarantee language)

Use installQualityFlags for safety and workmanship issues. salesPitchFeedback only when a customer conversation is visible — suggest stronger explanation of value (power gain, warranty, plan benefits). Omit evidenceShot unless a clear maintenance documentation frame is visible (inverter display, thermal hotspot, before/after panel condition). spokenCue: one action line, max ~12 words, Australian English. speak:false on most frames.`;

const PHASE_GUIDANCE: Record<AnalysisPhase, string> = {
  panel_clean: `${MAINTENANCE_GUIDANCE}
Task focus: PANEL CLEAN — pre-rinse, scrub technique, edge and lower-row coverage, Debris-Block or coating if applicable, final rinse, and power-gain documentation. Flag missed sections, streaking, or unsafe reach.`,
  pigeon_proofing: `${MAINTENANCE_GUIDANCE}
Task focus: PIGEON PROOFING — nest removal, mesh continuity at corners and penetrations, repellent application, and sign-off photos. Flag gaps, loose fixings, or incomplete nest clearance.`,
  thermal_scan: `${MAINTENANCE_GUIDANCE}
Task focus: THERMAL SCAN — hotspot capture protocol, inverter and string context, anomaly documentation, and report-ready framing. Flag missed scan angles or unreadable display data.`,
  exterior_clean: `${MAINTENANCE_GUIDANCE}
Task focus: EXTERIOR CLEAN — gutters, skylights, soft wash paths, and property protection (plants, paint, drainage). Flag overspray risk, missed sections, or customer property issues.`,
  commercial_clean: `${MAINTENANCE_GUIDANCE}
Task focus: COMMERCIAL SOLAR CLEAN — scale, team coordination, access equipment, and per-visit documentation for maintenance contracts. Flag incomplete array coverage or missing visit record shots.`,
  site_survey: `Phase: SITE SURVEY — the worker is assessing the site before install. Prioritise:
- Roof type, pitch, orientation, condition, and structural soundness
- Shading (trees, chimneys, neighbours), usable array area, and panel layout options
- Switchboard, meter, isolator locations and cable run paths
- Access, hazards, and anything that affects the install plan/quote
On-roof workmanship is mostly not visible yet — keep installQualityFlags to genuine survey risks. salesPitchFeedback only if a customer is being spoken to.`,
  solar_install: `Phase: INSTALL — the worker is on the roof or at the switchboard. Prioritise SAFETY FIRST:
- Fall protection, harness/anchor use, edge protection, ladder safety
Then workmanship: rail/bracket layout, penetrations + flashing/waterproofing, panel alignment, clamp/torque, DC routing, isolator placement.

CER COMPLIANCE — actively hunt these 5 high-value, commonly-failed defects (a wrong/missing one fails the claim and forces a return to site). Flag the one in view:
1. Labelling/signage: missing or wrong "Solar Supply Main Switch", AC/DC isolator labels, or system-rating signage — warning.
2. DC isolator / rooftop isolation: missing, unlabelled or non-compliant isolator — warning (critical if live DC looks exposed/unsafe).
3. DC not in conduit: any exposed/unprotected DC cable run on the roof or wall — warning.
4. Switchboard shutdown-procedure label: missing emergency shutdown steps at the main switchboard — warning.
5. Serial vs REC registry: when a panel/inverter serial or compliance plate is visible, prompt a clear, legible serial photo so it matches the REC registry claim — info.

Lead with critical safety, then the most important CER defect, in installQualityFlags; put that single most important issue in spokenCue (≤12 words, action-verb first, Australian English). For each CER defect in view, add exactly one visualCallout (category: quality) whose message matches the spokenCue intent. When the shot is compliant with no defect in view, set spokenCue.say to a short pass like "Shot looks compliant" and speak:false. salesPitchFeedback only if a customer conversation is happening.`,
  customer_pitch: `Phase: CUSTOMER PITCH — the worker is talking with a customer (door knock or on site). Prioritise the CONVERSATION:
- Critique the pitch from the transcript: rapport, savings/payback framing, warranty, timeline, objection handling, and the close
- salesPitchFeedback MUST be non-empty when a transcript is present: at least one critique and one stronger line to use next time
- Use visualCallouts for visible upsell opportunities
Safety/quality flags only if something genuinely unsafe is visible.`,
};

const MAINTENANCE_PHASES = new Set<string>([
  "panel_clean",
  "pigeon_proofing",
  "thermal_scan",
  "exterior_clean",
  "commercial_clean",
]);

function isAnalysisPhase(value?: string): value is AnalysisPhase {
  return value != null && value in PHASE_GUIDANCE;
}

export function isMaintenanceAnalysisPhase(jobType?: string): boolean {
  return jobType != null && MAINTENANCE_PHASES.has(jobType);
}

export function phaseGuidance(jobType?: string): string | null {
  return isAnalysisPhase(jobType) ? PHASE_GUIDANCE[jobType] : null;
}

/** Maintenance + install = quieter on-screen (2); survey/pitch = 3. */
export function maxCalloutsForPhase(jobType?: string): number {
  if (
    jobType === "solar_install" ||
    isMaintenanceAnalysisPhase(jobType)
  ) {
    return 2;
  }
  return 3;
}
