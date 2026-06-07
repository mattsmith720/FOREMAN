/**
 * Landing visual assets. Swap infographics in public/assets/infographics/
 * without touching page copy. See docs/landing/NOTEBOOKLM_IMAGE_BRIEF.md
 */

const INFO = "/assets/infographics";

/** Swap `.svg` → `.png` when Notebook LM exports land (same basename). */
export const media = {
  hero: {
    src: `${INFO}/hero-job-flow.svg`,
    alt: "Foreman flow: record a maintenance visit, build training data, onboard new hires",
  },
  pain: [
    { src: `${INFO}/pain-failed-claims.svg`, alt: "Owner training every new hire on the roof" },
    { src: `${INFO}/pain-camera-chaos.svg`, alt: "Inconsistent technique across maintenance crews" },
    { src: `${INFO}/pain-regulator-ai.svg`, alt: "Job video sitting in camera rolls unused" },
    { src: `${INFO}/pain-callback.svg`, alt: "Franchise growth blocked by training bottleneck" },
  ],
  features: [
    { src: `${INFO}/feature-evidence.svg`, alt: "Record maintenance visits into a private training library" },
    { src: `${INFO}/feature-coaching.svg`, alt: "Live technique and safety coaching on the roof" },
    { src: `${INFO}/feature-pack.svg`, alt: "Auto-generated onboarding module from a completed job" },
    { src: `${INFO}/feature-dashboard.svg`, alt: "Visit records and training modules per tech" },
  ],
} as const;
