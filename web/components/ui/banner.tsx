import type { HTMLAttributes, ReactNode } from "react";

type BannerTone = "error" | "warning" | "info";

export interface BannerProps extends HTMLAttributes<HTMLParagraphElement> {
  tone: BannerTone;
  children: ReactNode;
}

const TONE_CLASS: Record<BannerTone, string> = {
  error: "fm-banner fm-banner--error",
  warning: "fm-banner fm-banner--warning",
  info: "fm-banner fm-banner--info",
};

export function Banner({ tone, className, children, ...rest }: BannerProps) {
  const classes = className ? `${TONE_CLASS[tone]} ${className}` : TONE_CLASS[tone];
  return (
    <p className={classes} role={tone === "error" ? "alert" : "status"} {...rest}>
      {children}
    </p>
  );
}
