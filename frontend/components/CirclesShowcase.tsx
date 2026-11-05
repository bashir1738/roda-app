import { Container, Section, SectionHeading } from "./ui";

const POINTS = [
  "Invite people you trust. Set the amount and the schedule once.",
  "Contributions and payouts run onchain — no ledger book, no chasing.",
  "Each member receives the pot in turn, with a public record of every round.",
];

export function CirclesShowcase() {
  return (
    <Section id="circles" className="bg-surface-sand">
      <Container className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="order-2 lg:order-1">
          <div className="rounded-xl border-2 border-charcoal bg-white p-7 shadow-[7px_7px_0_#111] sm:p-9">
            <div className="flex items-start justify-between gap-4 border-b-2 border-charcoal pb-5">
              <div>
                <p className="inline-block bg-butter px-2 py-1 text-base font-bold text-charcoal">Global Savers</p>
                <p className="mt-1 text-[13px] text-muted">8 members · $500 weekly</p>
              </div>
              <p className="border-2 border-charcoal bg-sky px-2 py-1 text-[12px] font-bold text-charcoal">Round 6 / 8</p>
            </div>

            <div className="mt-6 border-2 border-charcoal bg-[#9BE7B2] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal">
                Current pot
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                $4,000
              </p>
              <div className="mt-6 h-3 overflow-hidden border-2 border-charcoal bg-white">
                <div className="h-full w-3/4 bg-charcoal" />
              </div>
              <p className="mt-3 text-[12px] font-semibold text-charcoal">
                6 of 8 contributions collected
              </p>
            </div>

            <ul className="mt-8 space-y-0">
              {[
                { name: "Elena", status: "paid", round: "4", color: "bg-sky" },
                { name: "Marcus", status: "paid", round: "5", color: "bg-blush" },
                { name: "You", status: "next", round: "6", color: "bg-butter" },
              ].map((m) => (
                <li
                  key={m.name}
                  className="flex items-center justify-between border-t-2 border-charcoal py-4"
                >
                  <span className={`border-2 border-charcoal ${m.color} px-2 py-1 text-sm font-bold text-charcoal`}>{m.name}</span>
                  <span className="text-[12px] font-semibold text-charcoal">
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
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-charcoal text-[13px] font-extrabold text-charcoal ${
                  i === 0 ? "bg-butter" : i === 1 ? "bg-blush" : "bg-sky"
                }`}>
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
