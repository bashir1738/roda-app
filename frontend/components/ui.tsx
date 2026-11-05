import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-8xl px-6 sm:px-10 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-24 sm:py-32 lg:py-40 ${className}`}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#765500]">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  const isCenter = align === "center";
  return (
    <div className={isCenter ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-[15px] leading-7 text-muted sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export type ButtonVariant =
  | "primary"
  | "primary-inverted"
  | "secondary"
  | "secondary-inverted"
  | "ghost";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  className = "",
) {
  const base =
    "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-charcoal px-6 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5";
  const variants = {
    primary: "bg-primary text-black shadow-[4px_4px_0_#111] hover:bg-primary-light font-semibold",
    "primary-inverted": "bg-white text-charcoal shadow-[4px_4px_0_#111] hover:bg-lavender font-semibold",
    secondary:
      "border-2 border-charcoal bg-white text-charcoal shadow-[4px_4px_0_#111] hover:bg-surface-sand",
    "secondary-inverted":
      "border border-white/20 bg-transparent text-white hover:bg-white/10",
    ghost: "text-muted hover:text-charcoal",
  } as const;

  return `${base} ${variants[variant]} ${className}`;
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  className?: string;
};

export function Button({
  children,
  href = "#",
  variant = "primary",
  className = "",
}: ButtonProps) {
  return (
    <a href={href} className={buttonClasses(variant, className)}>
      {children}
    </a>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "sage";
  className?: string;
}) {
  const tones = {
    neutral: "text-muted",
    accent: "text-[#765500]",
    sage: "text-[#765500]",
  } as const;
  return (
    <span
      className={`inline-flex items-center text-xs font-medium tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border-2 border-charcoal bg-white p-8 shadow-[6px_6px_0_#111] sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
