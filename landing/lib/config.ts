/** Public marketing site config — no secrets. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://landing-lac-mu.vercel.app";

export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL?.trim() ?? "";

export const DEMO_URL =
  process.env.NEXT_PUBLIC_DEMO_URL ?? "https://foreman-phi.vercel.app/demo";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://foreman-phi.vercel.app";

export const PILOT_BADGE =
  process.env.NEXT_PUBLIC_PILOT_BADGE ??
  "Built on the roof with real install crews";

export const ANNOUNCEMENT =
  process.env.NEXT_PUBLIC_ANNOUNCEMENT ??
  "Now piloting with Brisbane solar crews — Book a demo";
