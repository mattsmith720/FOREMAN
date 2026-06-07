import { LandingVisual } from "./landing-visual";

export interface FeatureShowcaseProps {
  title: string;
  headline: string;
  body: string;
  image: string;
  alt: string;
  reversed?: boolean;
  index?: number;
}

export function FeatureShowcase({
  title,
  headline,
  body,
  image,
  alt,
  reversed,
  index,
}: FeatureShowcaseProps) {
  const indexLabel = index !== undefined ? String(index + 1).padStart(2, "0") : null;

  return (
    <article className={`lp-showcase${reversed ? " lp-showcase--reverse" : ""}`}>
      <div className="lp-showcase-copy">
        {indexLabel && <span className="lp-showcase-index">{indexLabel}</span>}
        <p className="lp-showcase-eyebrow">{title}</p>
        <h3 className="lp-showcase-headline">{headline}</h3>
        <p className="lp-showcase-body">{body}</p>
      </div>
      <div className="lp-showcase-media">
        <LandingVisual src={image} alt={alt} width={900} height={600} />
      </div>
    </article>
  );
}
