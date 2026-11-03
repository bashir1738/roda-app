import { Container, Section, SectionHeading } from "./ui";

const POINTS = [
  "Invite people you trust. Set the amount and the schedule once.",
  "Contributions and payouts run onchain — no ledger book, no chasing.",
  "Each member receives the pot in turn, with a public record of every round.",
];

export function CirclesShowcase() {
  return (
    <Section id="circles" className="bg-white">
      <Container className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-border-subtle p-7 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-medium text-charcoal">Global Savers</p>
                <p className="mt-1 text-[13px] text-muted">8 members · $500 weekly</p>
              </div>
              <p className="text-[12px] text-muted">Round 6 / 8</p>
            </div>

            <div className="mt-8 border-t border-border-subtle pt-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                Current pot
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                $4,000
              </p>
              <div className="mt-6 h-px overflow-hidden bg-border-subtle">
                <div className="h-full w-3/4 bg-charcoal" />
              </div>
              <p className="mt-3 text-[12px] text-muted">
                6 of 8 contributions collected
              </p>
            </div>

            <ul className="mt-8 space-y-0">
              {[
                { name: "Elena", status: "paid", round: "4" },
                { name: "Marcus", status: "paid", round: "5" },
                { name: "You", status: "next", round: "6" },
              ].map((m) => (
                <li
                  key={m.name}
                  className="flex items-center justify-between border-t border-border-subtle py-4"
                >
                  <span className="text-sm text-charcoal">{m.name}</span>
                  <span className="text-[12px] text-muted">
                    {m.status === "next" ? "Up next" : "Paid"} · Round {m.round}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:pt-4">
          <SectionHeading
            eyebrow="Rotating savings"
            title="Community pots, with a public ledger."
            description="Ajo and esusu have built wealth for generations. Roda keeps the trust, and replaces skipped payments and missing books with on-chain rules."
          />

          <ol className="mt-12 space-y-8">
            {POINTS.map((p, i) => (
              <li key={p} className="flex gap-5">
                <span className="w-6 shrink-0 text-[13px] text-muted">
                  0{i + 1}
                </span>
                <p className="text-[15px] leading-7 text-charcoal">{p}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
