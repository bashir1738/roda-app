import type { ReactNode } from "react";
import { Container, Section, SectionHeading } from "./ui";
import {
  ShieldIcon,
  TrendingUpIcon,
  GlobeIcon,
  WalletIcon,
  BoltIcon,
  GiftIcon,
} from "./icons";

const FEATURES: {
  icon: (props: { className?: string }) => ReactNode;
  title: string;
  body: string;
}[] = [
  {
    icon: ShieldIcon,
    title: "Everyone plays fair",
    body: "Amount, schedule, and payout order are locked onchain. Add optional reputation gates so high-trust circles stay reliable.",
  },
  {
    icon: TrendingUpIcon,
    title: "Solo savings vaults",
    body: "Save freely in Flex Solo or build habit discipline across 7-day, 30-day, 6-month, and 1-year USDC commitment vaults.",
  },
  {
    icon: WalletIcon,
    title: "Hard-capped DAO budgets",
    body: "Back community treasuries with Sputnik DAO + Trezu. Escrow envelopes cannot be overspent — only council Call proposals unlock funds.",
  },
  {
    icon: GlobeIcon,
    title: "On-chain reputation",
    body: "Build a portable 0–1000 trust score weighted by real USDC contributions, completed circles, matured vaults, and tenure.",
  },
  {
    icon: GiftIcon,
    title: "Bounties & auto-rewards",
    body: "Post Sputnik DAO bounties or automate Roda envelope rewards triggered directly when members finish circle rounds or streaks.",
  },
  {
    icon: BoltIcon,
    title: "Collective ownership",
    body: "Community deposits and DAO grants mint on-chain shares with pro-rata surplus distribution — zero custodial gatekeepers.",
  },
];

export function Features() {
  return (
    <Section className="bg-surface-sand">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="Why Roda"
          title="The tradition, with fewer surprises."
          description="Everything that made group savings work — now automated, visible, and under your own keys."
        />

        <div className="mt-20 grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, index) => {
            const Icon = f.icon;
            const colors = ["bg-butter", "bg-blush", "bg-sky", "bg-[#9BE7B2]", "bg-butter", "bg-blush"];
            return (
              <div key={f.title} className={`border-2 border-charcoal ${colors[index]} p-6 shadow-[5px_5px_0_#111]`}>
                <div className="flex h-10 w-10 items-center justify-center border-2 border-charcoal bg-white">
                  <Icon className="h-5 w-5 text-charcoal" />
                </div>
                <h3 className="mt-5 text-lg font-bold tracking-tight text-charcoal">
                  {f.title}
                </h3>
                <p className="mt-3 text-[14px] leading-6 text-muted">{f.body}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
