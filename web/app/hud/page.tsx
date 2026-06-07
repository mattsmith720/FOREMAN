import type { Metadata } from "next";
import { HudCoach } from "../../components/hud-coach";

export const metadata: Metadata = {
  title: "Foreman HUD",
  description: "Heads-up coaching display for Meta Ray-Ban Display glasses.",
};

// Thin HUD client (separate from the phone app) for the ~600x600 glasses display.
export default function HudPage() {
  return <HudCoach />;
}
