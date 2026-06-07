import { APP_URL, DEMO_URL, SITE_URL } from "./config";

export const site = {
  name: "Foreman",
  tagline: "Field intelligence for solar maintenance crews",
  description:
    "Phone-first AI for Australian solar maintenance teams. Record real jobs, coach techs on the roof, and auto-build onboarding packages from your own footage.",
  url: SITE_URL,
  demoUrl: DEMO_URL,
  appUrl: APP_URL,
  company: "Unicity",
  location: "Brisbane, AU",
  year: 2026,
} as const;
