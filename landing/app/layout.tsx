import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { JsonLd, SEO_DESCRIPTION } from "@/components/json-ld";
import { site } from "@/lib/site";
import "./globals.css";

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-var",
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body-var",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Foreman | AI coaching for solar maintenance crews",
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
    title: "Foreman | AI coaching for solar maintenance crews",
    description: SEO_DESCRIPTION,
    images: [{ url: "/og.png", width: 1024, height: 1024, alt: "Foreman" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Foreman | AI coaching for solar maintenance crews",
    description: SEO_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" className={`${mono.variable} ${sans.variable}`}>
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
