import Image from "next/image";
import { Container, Section, SectionHeading } from "./ui";

const STEPS = [
  {
    step: "01",
    title: "Connect a wallet",
    body: "Start in seconds with Magic Link email or Meteor wallet. Your funds stay strictly under your own self-custody keys.",
    badge: "Fast Onboarding",
    color: "bg-butter",
  },
  {
    step: "02",
    title: "Create or join a circle",
    body: "Set the deposit amount, cadence, and payout sequence — or jump right into your family circle with a 6-digit code.",
    badge: "Smart Rules",
    color: "bg-blush",
  },
  {
    step: "03",
    title: "Payouts run themselves",
    body: "Members deposit on schedule. The pool rotates to the next member automatically onchain. Zero awkward chasing.",
    badge: "Automated Rotations",
    color: "bg-sky",
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
          description="No branch visit, no paper ledger. Open the app, join a circle, and let the smart contract do the accounting."
        />

        {/* ── Featured Walkthrough Banner with /step-wallet.jpg ── */}
        <div className="mt-14 mb-16 overflow-hidden rounded-2xl border-2 border-charcoal bg-white shadow-[8px_8px_0_#111]">
          <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div className="order-2 lg:order-1">
              <span className="inline-block border-2 border-charcoal bg-[#9BE7B2] px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-charcoal shadow-[2px_2px_0_#111]">
                Zero Friction Setup
              </span>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-charcoal sm:text-3xl lg:text-4xl">
                Real savings in your hands in under 60 seconds.
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-base">
                Whether you use email via Magic OTP or Meteor wallet on mobile, getting started requires zero crypto knowledge. You get an implicit NEAR account automatically, ready for solo vault deposits or collaborative savings circles.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-butter px-3 py-1 text-[12px] font-bold text-charcoal">
                  6-Digit Circle Invites
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-sky px-3 py-1 text-[12px] font-bold text-charcoal">
                  Native Biometrics & PIN
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-charcoal bg-blush px-3 py-1 text-[12px] font-bold text-charcoal">
                  Instant USDC Transfers
                </span>
              </div>
            </div>

            <div className="group relative order-1 aspect-[4/3] w-full overflow-hidden rounded-xl border-2 border-charcoal bg-[#FDFBF7] shadow-[5px_5px_0_#111] lg:order-2">
              <Image
                src="/step-wallet.jpg"
                alt="Hands holding smartphone with clean green Roda savings dashboard"
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute left-4 top-4 border-2 border-charcoal bg-white/95 px-3 py-1 text-[11px] font-bold text-charcoal shadow-[2px_2px_0_#111] backdrop-blur-sm">
                📱 Roda Mobile Experience
              </div>
              <div className="absolute bottom-4 right-4 border-2 border-charcoal bg-[#00C08B] px-3 py-1 text-[11px] font-bold text-charcoal shadow-[2px_2px_0_#111]">
                Self-Custody Keys
              </div>
            </div>
          </div>
        </div>

        {/* ── 3 Steps Grid ── */}
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`flex flex-col justify-between rounded-xl border-2 border-charcoal p-7 shadow-[6px_6px_0_#111] transition-transform duration-300 hover:-translate-y-1 ${s.color}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="inline-block border-2 border-charcoal bg-white px-2.5 py-1 text-[14px] font-extrabold tracking-[0.16em] text-charcoal shadow-[2px_2px_0_#111]">
                    {s.step}
                  </p>
                  <span className="border-2 border-charcoal bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-charcoal">
                    {s.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-charcoal">
                  {s.title}
                </h3>
                <p className="mt-3 text-[14px] leading-6 text-charcoal/85">
                  {s.body}
                </p>
              </div>

              <div className="mt-6 border-t border-charcoal/20 pt-4">
                <span className="text-[12px] font-bold text-charcoal">
                  Step {s.step} of 03 →
                </span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
