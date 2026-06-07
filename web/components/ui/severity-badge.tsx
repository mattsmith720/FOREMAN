import type { HTMLAttributes } from "react";

export type SeverityLevel = "critical" | "warning" | "info";

export interface SeverityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level: SeverityLevel;
  label: string;
}

const LEVEL_CLASS: Record<SeverityLevel, string> = {
  critical: "fm-severity-badge fm-severity-badge--critical",
  warning: "fm-severity-badge fm-severity-badge--warning",
  info: "fm-severity-badge fm-severity-badge--info",
};

export function SeverityBadge({ level, label, className, ...rest }: SeverityBadgeProps) {
  const classes = className
    ? `${LEVEL_CLASS[level]} ${className}`
    : LEVEL_CLASS[level];
  return (
    <span className={classes} {...rest}>
      {label}
    </span>
  );
}
