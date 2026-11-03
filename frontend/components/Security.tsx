import { Container, Section } from "./ui";
import { CheckIcon } from "./icons";

const ASSURANCES = [
  {
    title: "Non-custodial",
    body: "Only you hold keys to vault deposits. Roda cannot seize or pause your funds.",
  },
  {
    title: "Immutable rules",
    body: "Circle terms live in the Roda NEAR contract. No one can quietly rewrite payouts.",
  },
  {
    title: "Public ledger",
    body: "Every contribution and payout is verifiable onchain. No hidden balances.",
  },
];

const CHECKLIST = [
  "Rules enforced by the NEAR contract",
  "No maintenance charges",
  "Automated payout engine",
];

export function Security() {
  return (
    <Section id="security" className="bg-surface-sand">
      <Container>
        <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted">
              Security
            </p>
            <h2 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl">
              You should never have to guess where the money is.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-muted">
              Traditional circles rely on a bookkeeper. Roda keeps the social
              trust and adds a mathematical record.
            </p>

            <ul className="mt-10 space-y-3">
              {CHECKLIST.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-3 text-[14px] text-charcoal"
                >
                  <CheckIcon className="h-4 w-4 text-muted" />
                  {line}
                </li>
              ))}
            </ul>

          </div>

          <div className="divide-y divide-border-subtle border-y border-border-subtle">
            {ASSURANCES.map((a) => (
              <div key={a.title} className="py-8">
                <h3 className="text-base font-medium text-charcoal">{a.title}</h3>
                <p className="mt-2 max-w-md text-[14px] leading-6 text-muted">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
