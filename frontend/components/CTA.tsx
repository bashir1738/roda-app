import { Container, Section, Button } from "./ui";
import { GetAppButton } from "./GetAppModal";

export function CTA() {
  return (
    <Section id="cta" className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="absolute left-1/2 top-1/2 -ml-24 -mt-24 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lavender-glow/20 blur-3xl" />
      <Container className="relative z-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary-light">
            Get started
          </p>
          <h2 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl lg:text-[2.75rem]">
            Make the next circle count.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-muted">
            Start or join in minutes. One flat 0.3% fee when the pot pays out.
            No maintenance fees.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GetAppButton variant="primary">Get the app</GetAppButton>
            <Button href="#how" variant="secondary">
              How it works
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
