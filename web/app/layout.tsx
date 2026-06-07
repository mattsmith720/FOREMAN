import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foreman — AI coach for solar crews",
  description:
    "Live, hands-free AI coaching for solar installers and door-knock reps — catches safety and quality issues on the spot, sharpens the pitch, and logs proof of every job.",
  appleWebApp: {
    capable: true,
    title: "Foreman",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
