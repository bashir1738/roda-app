import { Container, Button } from "./ui";
import { GetAppButton } from "./GetAppModal";
import { AppPreview } from "./AppPreview";

const HIGHLIGHTS = [
  "No account or maintenance fees",
  "On-chain payouts",
  "One flat 0.3% payout fee",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <Container className="relative z-10 grid items-center gap-16 pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-32 lg:pb-32">
        <div className="roda-rise max-w-xl pb-20 lg:pb-0">
          <h1 className="text-[3rem] font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-6xl lg:text-[4.5rem]">
            Save together.
            <br />
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">Grow together.</span>
          </h1>

          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted sm:text-lg">
            Roda brings ajo and esusu rotating savings onchain. Join a trusted
            circle, follow automated payouts, and keep your keys — without
            the paperwork.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <GetAppButton variant="primary">Start a circle</GetAppButton>
            <Button href="#how" variant="secondary">
              How it works
            </Button>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-border-subtle pt-8">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2 text-[14px] font-medium text-charcoal">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-light" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Right side with the AppPreview */}
        <div className="roda-rise relative flex justify-center pb-12 lg:pb-0">
          <div className="relative z-10 mx-auto w-full max-w-[280px] sm:max-w-[320px] transition-transform duration-700 hover:-translate-y-2">
            <AppPreview />
          </div>
        </div>
      </Container>
    </section>
  );
}
