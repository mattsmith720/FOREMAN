import { FAQ_ITEMS } from "@/lib/faq-content";
import { site } from "@/lib/site";

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
