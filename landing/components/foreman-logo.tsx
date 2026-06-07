import Image from "next/image";
import Link from "next/link";

type ForemanLogoProps = {
  className?: string;
};

export function ForemanLogo({ className }: ForemanLogoProps) {
  return (
    <Link
      href="/"
      className={["lp-logo", className].filter(Boolean).join(" ")}
      aria-label="Foreman home"
    >
      <Image
        src="/logo-lockup.png"
        alt=""
        width={160}
        height={40}
        className="lp-logo-image"
        priority
      />
    </Link>
  );
}
