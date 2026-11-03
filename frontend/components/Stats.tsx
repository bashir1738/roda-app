import { Container } from "./ui";

const STATS = [
  { value: "0.3%", label: "Flat fee on payouts — disclosed up front" },
  { value: "$0", label: "Account maintenance" },
  { value: "100%", label: "On-chain ledger" },
  { value: "24/7", label: "Withdraw anytime" },
];

export function Stats() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4 lg:gap-12">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-semibold tracking-tight text-charcoal sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 max-w-[11rem] text-[13px] leading-5 text-muted">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
