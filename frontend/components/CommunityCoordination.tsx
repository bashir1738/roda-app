import { Container, Section, SectionHeading } from "./ui";

const PILLARS = [
  {
    badge: "Split Custody",
    title: "Sputnik DAO + Roda Envelope Escrow",
    body: "Operations funds stay visible inside Trezu (mainnet only) on your Sputnik DAO, while project budgets sit in hard-capped Roda envelopes that only council Call proposals can unlock.",
    color: "bg-butter",
  },
  {
    badge: "On-Chain Reputation",
    title: "Capital-Weighted Trust (0–1000)",
    body: "On-time circle payments, matured solo vaults, tenure, and treasury deposits build verifiable reputation — unlocking gated high-trust circles with zero Sybil shortcuts.",
    color: "bg-[#9BE7B2]",
  },
  {
    badge: "Rewards & Shares",
    title: "Auto-Rewards & Collective Ownership",
    body: "Combine Sputnik bounties with automated payout rewards, mint shares when funding community pools, and claim pro-rata surplus if a community dissolves.",
    color: "bg-sky",
  },
];

const ENVELOPES = [
  { name: "Community Grants", spent: 1800, allocated: 3000, bar: "w-3/5", accent: "bg-[#00C08B]" },
  { name: "Member Rewards", spent: 450, allocated: 1200, bar: "w-3/8", accent: "bg-sky" },
  { name: "Local Events", spent: 600, allocated: 800, bar: "w-3/4", accent: "bg-blush" },
];

export function CommunityCoordination() {
  return (
    <Section id="community" className="bg-surface-sand">
      <Container className="grid items-start gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="min-w-0 lg:pt-2">
          <SectionHeading
            eyebrow="Community Coordination"
            title="Shared budgets backed by Sputnik DAO & Trezu (mainnet only)."
            description="Scale beyond a single circle. Launch a multi-sig community DAO from mobile, route project funds through hard-capped envelopes, reward reliable savers automatically, and open Trezu (mainnet only) in one tap for swaps or batch payouts."
          />

          <div className="mt-10 space-y-5">
            {PILLARS.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border-2 border-charcoal bg-white p-5 shadow-[5px_5px_0_#111]"
              >
                <span
                  className={`inline-block border-2 border-charcoal ${item.color} px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-charcoal`}
                >
                  {item.badge}
                </span>
                <h3 className="mt-3 text-base font-bold text-charcoal">{item.title}</h3>
                <p className="mt-1.5 text-[14px] leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-xl border-2 border-charcoal bg-white p-4 shadow-[5px_5px_0_#111] sm:p-8 sm:shadow-[7px_7px_0_#111] lg:p-9">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-charcoal pb-5">
            <div className="min-w-0">
              <p className="inline-block border-2 border-charcoal bg-[#9BE7B2] px-2.5 py-1 text-sm font-extrabold text-charcoal">
                Lagos Builders Guild
              </p>
              <p className="mt-2 break-words font-mono text-[11px] text-muted sm:text-[12px]">
                lagos-guild.sputnik-dao.near · Linked
              </p>
            </div>
            <span className="border-2 border-charcoal bg-butter px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-charcoal sm:text-[11px]">
              Trezu Ready (Mainnet Only)
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 border-2 border-charcoal bg-sky p-3.5 sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal">
                DAO Ops Treasury
              </p>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-charcoal sm:text-2xl">$6,400</p>
              <p className="mt-1 text-[11px] font-medium text-charcoal/80">
                NEAR + USDC in Sputnik
              </p>
            </div>
            <div className="min-w-0 border-2 border-charcoal bg-[#9BE7B2] p-3.5 sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal">
                Envelope Escrow
              </p>
              <p className="mt-1.5 text-xl font-extrabold tabular-nums text-charcoal sm:text-2xl">$5,000</p>
              <p className="mt-1 text-[11px] font-medium text-charcoal/80">
                Hard-capped in Roda
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-charcoal">
                Active Budget Envelopes
              </p>
              <p className="text-[11px] font-semibold text-muted">DAO Vote Required</p>
            </div>

            <div className="mt-4 space-y-3.5 sm:space-y-4">
              {ENVELOPES.map((env) => (
                <div key={env.name} className="border-2 border-charcoal bg-surface-sand p-3 sm:p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[12px] font-bold text-charcoal sm:text-[13px]">
                    <span>{env.name}</span>
                    <span className="whitespace-nowrap tabular-nums">
                      ${env.spent.toLocaleString()} / ${env.allocated.toLocaleString()} USDC
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden border border-charcoal bg-white">
                    <div className={`h-full ${env.bar} ${env.accent}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t-2 border-charcoal pt-5 text-[11px] font-bold text-charcoal sm:gap-3 sm:text-[12px]">
            <span className="border-2 border-charcoal bg-blush px-2.5 py-1">
              Rep Gate: 200+ pts
            </span>
            <span className="border-2 border-charcoal bg-butter px-2.5 py-1">
              Shares: 5,000 minted
            </span>
          </div>
        </div>
      </Container>
    </Section>
  );
}
