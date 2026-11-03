import { Container, Section, SectionHeading, Button } from "./ui";
import { CheckIcon } from "./icons";

const TIERS = [
  {
    name: "Flex Solo",
    lock: "No strict schedule",
    min: "Any amount",
    blurb: "Save for yourself at your own pace. Add funds whenever you have extra cash.",
    perks: ["No pressure", "Withdraw anytime", "For loose goals"],
    popular: false,
  },
  {
    name: "Weekly Solo",
    lock: "Weekly schedule",
    min: "From $10 / week",
    blurb: "Build consistency. Lock in a weekly amount to slowly build your personal pot.",
    perks: ["Automated discipline", "Custom lock times", "For steady habits"],
    popular: true,
  },
  {
    name: "Monthly Solo",
    lock: "Monthly schedule",
    min: "From $50 / month",
    blurb: "Pay yourself first. Set aside a fixed chunk of your paycheck every month.",
    perks: ["Payday alignment", "Long-term lock", "For major goals"],
    popular: false,
  },
];

export function VaultTiers() {
  return (
    <Section id="vaults" className="bg-white">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Solo Savings"
          title="Build your personal discipline."
          description="Choose a Solo plan to match your goals. No distractions, just pure on-chain discipline."
        />

        <div className="mt-20 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col p-8 sm:p-10 ${
                t.popular ? "bg-lavender relative" : "bg-white"
              }`}
            >
              {t.popular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-primary"></div>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className={`text-lg font-medium ${t.popular ? "text-primary" : "text-charcoal"}`}>
                  {t.name}
                </h3>
                {t.popular && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Popular
                  </span>
                )}
              </div>

              <div className="mt-8">
                <p className="text-[13px] text-muted">
                  <strong className="font-semibold text-charcoal">{t.min}</strong>
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {t.lock}
                </p>
              </div>
              <p className="mt-5 text-[14px] leading-6 text-muted">{t.blurb}</p>

              <ul className="mt-8 flex-1 space-y-3">
                {t.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-center gap-2.5 text-[13px] text-charcoal"
                  >
                    <CheckIcon className="h-3.5 w-3.5 text-muted" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Button href="#cta" variant="secondary" className="mt-10 w-full">
                Start {t.name}
              </Button>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
