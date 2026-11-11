import { Container, Section } from "./ui";
import { CheckIcon } from "./icons";

const ASSURANCES = [
  {
    title: "Non-custodial & split custody",
    body: "Only you hold keys to vault deposits, while community DAO ops treasuries live in Sputnik and budget envelopes remain locked in Roda escrow.",
  },
  {
    title: "DAO-gated spends & ceilings",
    body: "Envelope withdrawals require an approved Sputnik Call proposal and hard remaining-budget verification onchain.",
  },
  {
    title: "Atomic rollbacks & public ledger",
    body: "Every circle payout, reward, and spend uses promise callbacks — failed transfers restore state atomically and emit NEP-297 events.",
  },
];

const CHECKLIST = [
  "Rules enforced by the NEAR contract",
  "Sputnik DAO Call predecessor checks",
  "Sybil-resistant capital-weighted reputation",
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

          <div className="divide-y-2 divide-charcoal border-2 border-charcoal bg-white px-6 shadow-[6px_6px_0_#111]">
            {ASSURANCES.map((a, index) => (
              <div key={a.title} className={`-mx-6 px-6 py-8 ${
                index === 0 ? "bg-butter" : index === 1 ? "bg-sky" : "bg-[#9BE7B2]"
              }`}>
                <h3 className="text-base font-bold text-charcoal">{a.title}</h3>
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
