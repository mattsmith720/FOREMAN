import type { MetadataRoute } from "next";

// PWA manifest so a worker can add Foreman to their home screen and open it in
// one tap (standalone, no Safari chrome) before a job.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foreman — AI coach for solar crews",
    short_name: "Foreman",
    description:
      "Live, hands-free AI coaching for solar installers and door-knock reps.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#020617",
    theme_color: "#020617",
  };
}
