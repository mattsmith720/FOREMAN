import { APP_URL, DEMO_URL, SITE_URL } from "./config";

export const site = {
  name: "Foreman",
  tagline: "AI coaching for solar maintenance crews",
  description:
    "Foreman records maintenance jobs on the phone, provides live coaching, and generates end-of-job summaries and training modules.",
  url: SITE_URL,
  demoUrl: DEMO_URL,
  appUrl: APP_URL,
  company: "Unicity",
  location: "Brisbane, AU",
  year: 2026,
} as const;
