import type { HTMLAttributes, ReactNode } from "react";

export interface SheetProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function Sheet({ title, children, className, ...rest }: SheetProps) {
  const classes = className ? `fm-sheet ${className}` : "fm-sheet";
  return (
    <div className={classes} {...rest}>
      {title ? <h2 className="fm-sheet__title">{title}</h2> : null}
      {children}
    </div>
  );
}
