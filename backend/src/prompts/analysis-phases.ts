export type AnalysisPhase =
  | "site_survey"
  | "solar_install"
  | "customer_pitch";

// Phase-specific emphasis appended to the shared analysis prompt, selected by
// jobType. Keeps one base prompt (ANALYSIS_SYSTEM_PROMPT) DRY while steering the
// model toward what matters for the current field task.
const PHASE_GUIDANCE: Record<AnalysisPhase, string> = {
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

function isAnalysisPhase(value?: string): value is AnalysisPhase {
  return (
    value === "site_survey" ||
    value === "solar_install" ||
    value === "customer_pitch"
  );
}

export function phaseGuidance(jobType?: string): string | null {
  return isAnalysisPhase(jobType) ? PHASE_GUIDANCE[jobType] : null;
}

/** On-screen callout budget per phase: install = quieter (2), survey/pitch = 3. */
export function maxCalloutsForPhase(jobType?: string): number {
  if (jobType === "solar_install") {
    return 2;
  }
  return 3;
}
