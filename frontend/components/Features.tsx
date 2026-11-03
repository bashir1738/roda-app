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
    body: "Amount, schedule, and payout order are locked onchain. No skipped payments or quiet edits.",
  },
  {
    icon: TrendingUpIcon,
    title: "Always available",
    body: "Your personal savings aren't locked away. Withdraw your funds whenever you need them.",
  },
  {
    icon: WalletIcon,
    title: "No maintenance fees",
    body: "No monthly charges and no surprise deductions. The only fee is a flat 0.3% when a pot pays out.",
  },
  {
    icon: GlobeIcon,
    title: "Borderless circles",
    body: "Save with family across borders without wire delays or conversion theatre.",
  },
  {
    icon: GiftIcon,
    title: "Clear payouts",
    body: "See every contribution and the next distribution — no ambiguity, no private books.",
  },
  {
    icon: BoltIcon,
    title: "You hold the keys",
    body: "Non-custodial by default. Roda cannot freeze, lock, or move your funds.",
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
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title}>
                <Icon className="h-5 w-5 text-primary-light" />
                <h3 className="mt-5 text-lg font-medium tracking-tight text-primary">
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
