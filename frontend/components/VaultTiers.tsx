import Image from "next/image";
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
    blurb: "Build consistency. Lock in a weekly amount to slowly build your personal reserve.",
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
    <Section id="vaults" className="bg-surface-sand">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Solo Savings"
          title="Build your personal discipline."
          description="Choose a Solo plan to match your goals. No distractions, just pure on-chain discipline."
        />

        {/* ── Featured Visual Spotlight with /vault-3d.jpg ── */}
        <div className="mt-14 mb-16 overflow-hidden rounded-2xl border-2 border-charcoal bg-white shadow-[8px_8px_0_#111]">
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-14">
            <div className="group relative aspect-square max-h-[360px] w-full overflow-hidden rounded-xl border-2 border-charcoal bg-[#FDFBF7] shadow-[5px_5px_0_#111]">
              <Image
                src="/vault-3d.jpg"
                alt="3D On-chain Solo Vault Pot with NEAR Green Accents"
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute left-4 top-4 border-2 border-charcoal bg-[#00C08B] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-charcoal shadow-[2px_2px_0_#111]">
                🔒 100% Non-Custodial
              </div>
              <div className="absolute bottom-4 right-4 border-2 border-charcoal bg-butter px-3 py-1 text-[11px] font-bold text-charcoal shadow-[2px_2px_0_#111]">
                ✨ Automated Maturity
              </div>
            </div>

            <div>
              <span className="inline-block border-2 border-charcoal bg-butter px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-charcoal shadow-[2px_2px_0_#111]">
                Smart Contract Vaults
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl lg:text-4xl">
                Your personal vault, secured by mathematics.
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">
                Need to build savings discipline without social coordination? Lock away funds for a week, a month, or a full year. No organizer fees, no early temptation, and direct payouts to your wallet upon maturity.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-sky px-3 py-1 text-[12px] font-bold text-charcoal">
                  ✓ Zero Middleman Fees
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-[#9BE7B2] px-3 py-1 text-[12px] font-bold text-charcoal">
                  ✓ Yield: Planned for Mainnet
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-blush px-3 py-1 text-[12px] font-bold text-charcoal">
                  ✓ Withdraw Anytime on Flex
                </span>
              </div>

              <div className="mt-8 border-t-2 border-charcoal/15 pt-6">
                <p className="text-[13px] font-medium text-muted">
                  Enforced onchain via NEAR smart contracts. Roda never has custody of your private keys or deposits.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tier Cards ── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {TIERS.map((t, index) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-xl border-2 border-charcoal p-8 shadow-[6px_6px_0_#111] sm:p-10 ${
                t.popular ? "bg-butter relative" : index === 0 ? "bg-sky" : "bg-[#9BE7B2]"
              }`}
            >
              {t.popular && (
                <div className="absolute -right-2 -top-4 border-2 border-charcoal bg-blush px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal">Popular</div>
              )}
              <div className="flex items-baseline justify-between">
                <h3 className={`text-lg font-medium ${t.popular ? "text-[#765500]" : "text-charcoal"}`}>
                  {t.name}
                </h3>
                {t.popular && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#765500]">
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
