import type { HTMLAttributes, ReactNode } from "react";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  accent?: boolean;
  children: ReactNode;
}

export function Pill({ accent, className, children, ...rest }: PillProps) {
  const base = accent ? "fm-pill fm-pill--accent" : "fm-pill";
  const classes = className ? `${base} ${className}` : base;
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
}
