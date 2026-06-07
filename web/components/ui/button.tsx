import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "fm-button fm-button--primary",
  secondary: "fm-button fm-button--secondary",
  ghost: "fm-button fm-button--ghost",
};

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = className
    ? `${VARIANT_CLASS[variant]} ${className}`
    : VARIANT_CLASS[variant];
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
