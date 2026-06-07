import { APP_URL, DEMO_URL, SITE_URL } from "./config";

export const site = {
  name: "Foreman",
  tagline: "field_intelligence :: maintenance_crews",
  description:
    "Phone-native field intelligence for maintenance crews. Capture, coach, export, onboard.",
  url: SITE_URL,
  demoUrl: DEMO_URL,
  appUrl: APP_URL,
  company: "Unicity",
  location: "Brisbane, AU",
  year: 2026,
} as const;
