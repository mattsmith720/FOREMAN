import type { VisualCallout } from "@foreman/shared";

const SEVERITY_RANK: Record<VisualCallout["severity"], number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/** Pick the most important callout to highlight first. */
export function pickActiveCalloutIndex(callouts: VisualCallout[]): number {
  if (callouts.length === 0) {
    return 0;
  }

  let best = 0;
  let bestRank = -1;

  for (let i = 0; i < callouts.length; i++) {
    const rank = SEVERITY_RANK[callouts[i].severity];
    if (rank > bestRank) {
      bestRank = rank;
      best = i;
    }
  }

  return best;
}
