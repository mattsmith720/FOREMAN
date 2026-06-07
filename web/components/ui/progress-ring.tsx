import type { HTMLAttributes } from "react";

export function ProgressRing({
  className,
  "aria-label": ariaLabel = "Loading",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const classes = className ? `fm-progress-ring ${className}` : "fm-progress-ring";
  return <div className={classes} role="status" aria-label={ariaLabel} {...rest} />;
}
