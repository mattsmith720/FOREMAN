import { APP_URL, DEMO_URL, SITE_URL } from "./config";

export const site = {
  name: "Foreman",
  tagline: "Compliance execution for solar install crews",
  description:
    "Voice-guided CER evidence capture and real-time defect coaching for Australian solar install crews.",
  url: SITE_URL,
  demoUrl: DEMO_URL,
  appUrl: APP_URL,
  company: "Unicity",
  location: "Brisbane, AU",
  year: 2026,
} as const;
