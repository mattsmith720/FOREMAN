import type { HTMLAttributes, ReactNode } from "react";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  label: string;
}

export function StatCard({ value, label, className, ...rest }: StatCardProps) {
  const classes = className ? `fm-stat-card ${className}` : "fm-stat-card";
  return (
    <div className={classes} {...rest}>
      <span className="fm-stat-card__value">{value}</span>
      <span className="fm-stat-card__label">{label}</span>
    </div>
  );
}
