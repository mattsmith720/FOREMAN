import Image from "next/image";

export interface FeatureShowcaseProps {
  title: string;
  headline: string;
  body: string;
  image: string;
  alt: string;
  reversed?: boolean;
}

export function FeatureShowcase({
  title,
  headline,
  body,
  image,
  alt,
  reversed,
}: FeatureShowcaseProps) {
  return (
    <article className={`lp-showcase${reversed ? " lp-showcase--reverse" : ""}`}>
      <div className="lp-showcase-copy">
        <p className="lp-showcase-eyebrow">{title}</p>
        <h3 className="lp-showcase-headline">{headline}</h3>
        <p className="lp-showcase-body">{body}</p>
      </div>
      <div className="lp-showcase-media">
        <Image src={image} alt={alt} width={900} height={560} loading="lazy" />
      </div>
    </article>
  );
}
