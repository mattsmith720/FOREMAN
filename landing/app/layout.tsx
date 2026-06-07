import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { site } from "@/lib/site";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Foreman — Compliance execution for solar install crews",
    template: "%s · Foreman",
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: site.url,
    siteName: site.name,
    title: "Foreman — Compliance execution for solar install crews",
    description: site.description,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Foreman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Foreman — Compliance execution for solar install crews",
    description: site.description,
    images: ["/og.svg"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" className={plusJakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
