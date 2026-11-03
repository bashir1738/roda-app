import { Container, Section, SectionHeading } from "./ui";

const STEPS = [
  {
    step: "01",
    title: "Connect a wallet",
    body: "Start in seconds. Your funds stay under your own keys.",
  },
  {
    step: "02",
    title: "Create or join a circle",
    body: "Set the amount, schedule, and size — or join with a 6-digit circle code.",
  },
  {
    step: "03",
    title: "Payouts run themselves",
    body: "Members deposit on schedule. The pot rotates to the next member. No one holds the funds.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how" className="bg-surface-sand">
      <Container>
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Three steps. Then it runs."
          description="No branch visit, no paper ledger. Open the app, join a circle, and start."
        />

       

        <div className="mt-16 grid gap-12 lg:grid-cols-3 lg:gap-16">
          {STEPS.map((s) => (
            <div key={s.step}>
              <p className="text-[14px] font-semibold tracking-[0.16em] text-primary-light">{s.step}</p>
              <h3 className="mt-4 text-xl font-medium tracking-tight text-charcoal">
                {s.title}
              </h3>
              <p className="mt-3 max-w-xs text-[14px] leading-6 text-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
