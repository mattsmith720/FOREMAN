/** Public marketing site config. No secrets. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://landing-lac-mu.vercel.app";

export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL?.trim() ?? "";

export const DEMO_URL =
  process.env.NEXT_PUBLIC_DEMO_URL ?? "https://foreman-phi.vercel.app/demo";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://foreman-phi.vercel.app";

export const PILOT_BADGE =
  process.env.NEXT_PUBLIC_PILOT_BADGE ??
  "Piloting with SolarShield · Brisbane maintenance crews";

export const ANNOUNCEMENT =
  process.env.NEXT_PUBLIC_ANNOUNCEMENT ??
  "Now piloting with SolarShield · Brisbane · Book a demo";
