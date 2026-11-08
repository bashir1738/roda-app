import { Container, Button } from "./ui";
import { GetAppButton } from "./GetAppModal";
import { AppPreview } from "./AppPreview";

const HIGHLIGHTS = [
  "No account or maintenance fees",
  "Automated on-chain payouts",
  "One flat 0.3% payout fee",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-surface-sand">
      {/* Neo-brutalist decorative backdrop shapes */}
      <div className="pointer-events-none absolute -left-10 top-24 h-28 w-28 -rotate-12 border-2 border-charcoal bg-blush shadow-[6px_6px_0_#111] sm:h-36 sm:w-36" />
      <div className="pointer-events-none absolute bottom-10 right-1/3 h-16 w-16 rotate-12 border-2 border-charcoal bg-sky shadow-[5px_5px_0_#111]" />

      <Container className="relative z-10 grid items-center gap-16 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-28 lg:pb-28">
        <div className="roda-rise max-w-xl pb-12 lg:pb-0">
          <div className="mb-4 inline-flex items-center gap-2 border-2 border-charcoal bg-white px-3 py-1 text-[12px] font-bold text-charcoal shadow-[3px_3px_0_#111]">
            Live on NEAR Protocol
          </div>

          <h1 className="text-[3rem] font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-6xl lg:text-[4.5rem]">
            Save together.
            <br />
            <span className="inline-block -rotate-1 border-2 border-charcoal bg-[#00C08B] px-2 text-charcoal shadow-[6px_6px_0_#111]">
              Grow together.
            </span>
          </h1>

          <p className="mt-6 max-w-md border-l-4 border-[#00C08B] pl-4 text-[16px] leading-relaxed text-muted sm:text-lg">
            Roda brings collaborative rotating savings onchain. Join a trusted
            savings circle, follow automated distributions, and maintain full custody
            of your funds — without the paperwork.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <GetAppButton
              variant="primary"
              className="!bg-[#00C08B] hover:!bg-[#1AD9A4]"
            >
              Start a circle
            </GetAppButton>
            <Button
              href="#how"
              variant="secondary"
              className="!border-charcoal !bg-white !text-black hover:!bg-surface-sand"
            >
              How it works
            </Button>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t-2 border-charcoal pt-6">
            {HIGHLIGHTS.map((h, index) => (
              <li key={h} className="flex items-center gap-2 text-[14px] font-medium text-charcoal">
                <span className={`h-3 w-3 border-2 border-charcoal ${
                  index === 0 ? "bg-butter" : index === 1 ? "bg-blush" : "bg-sky"
                }`} />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Right side with AppPreview */}
        <div className="roda-rise relative flex justify-center pb-12 lg:pb-0">
          <div className="absolute left-1/2 top-0 z-0 h-56 w-48 -translate-x-1/2 rotate-6 border-2 border-charcoal bg-butter shadow-[7px_7px_0_#111] sm:h-64 sm:w-56" />

          {/* Center Phone Mockup */}
          <div className="relative z-10 mx-auto w-full max-w-[280px] sm:max-w-[320px] transition-transform duration-700 hover:-translate-y-2">
            <AppPreview />
          </div>
        </div>
      </Container>
    </section>
  );
}
