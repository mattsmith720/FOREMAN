import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";
import { JsonLd, SEO_DESCRIPTION } from "@/components/json-ld";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Foreman | Field intelligence for solar maintenance crews",
    template: "%s · Foreman",
  },
  description: SEO_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: site.url,
    siteName: site.name,
    title: "Foreman | Field intelligence for solar maintenance crews",
    description: SEO_DESCRIPTION,
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Foreman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Foreman | Field intelligence for solar maintenance crews",
    description: SEO_DESCRIPTION,
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
    <html lang="en-AU" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body>
        <a href="#main" className="lp-skip">
          Skip to content
        </a>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
