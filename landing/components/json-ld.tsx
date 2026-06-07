import { site } from "@/lib/site";

const FAQ_ITEMS = [
  {
    q: "What is Foreman?",
    a: "Foreman is an AI layer for solar maintenance crews. It runs on the phone during real jobs, coaches technique and safety on the roof, and turns visit footage into structured training data and onboarding modules.",
  },
  {
    q: "How does this help SolarShield scale?",
    a: "Your best techs record gold-standard visits once. Foreman extracts steps, safety notes, and common mistakes into training packages new hires follow without the owner on every roof.",
  },
  {
    q: "Do I need smart glasses?",
    a: "No. Foreman is phone-first today. Meta smart glasses support is coming for fully hands-free capture, but the pilot runs on a standard smartphone.",
  },
  {
    q: "What happens to our video footage?",
    a: "Frames, audio, and transcripts are stored in your private Foreman dataset. You can export for Whisper fine-tuning and future proprietary model training.",
  },
  {
    q: "Is my data secure?",
    a: "Recording is consent-first on every job. Evidence is encrypted in transit and stored in access-controlled systems.",
  },
  {
    q: "What does it cost?",
    a: "Per-tech monthly seats. Pilot pricing is discussed on the demo call.",
  },
  {
    q: "What's included in the pilot?",
    a: "Typically 2 to 3 techs on real maintenance jobs, video ingest, live coaching, training module generation, and end-of-job summaries.",
  },
  {
    q: "How do we get started?",
    a: "Book a demo. We upload existing job videos, run one live visit, and generate the first onboarding module from your best tech's footage.",
  },
] as const;

export const SEO_DESCRIPTION = site.description;

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/og.svg`,
    description: SEO_DESCRIPTION,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Brisbane",
      addressCountry: "AU",
    },
    parentOrganization: {
      "@type": "Organization",
      name: site.company,
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: SEO_DESCRIPTION,
    inLanguage: "en-AU",
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <JsonLdScript data={organization} />
      <JsonLdScript data={website} />
      <JsonLdScript data={faqPage} />
    </>
  );
}
