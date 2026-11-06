import Image from "next/image";
import { Container, Section, Button } from "./ui";
import { GetAppButton } from "./GetAppModal";

export function CTA() {
  return (
    <Section id="cta" className="relative overflow-hidden bg-butter py-24 sm:py-32">
      {/* Floating Card 1: /vault-3d.jpg (Left floating accent) */}
      <div className="pointer-events-none absolute -left-12 top-10 hidden h-44 w-40 -rotate-12 overflow-hidden border-2 border-charcoal bg-white shadow-[7px_7px_0_#111] md:block lg:left-8 lg:h-52 lg:w-48">
        <div className="relative h-32 w-full overflow-hidden bg-surface-sand lg:h-38">
          <Image
            src="/vault-3d.jpg"
            alt="On-chain savings vault pot"
            fill
            sizes="192px"
            className="object-cover"
          />
        </div>
        <div className="border-t-2 border-charcoal bg-[#9BE7B2] px-2.5 py-1.5 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal">
            🔒 On-Chain Solo Vaults
          </p>
        </div>
      </div>

      {/* Floating Card 2: /step-wallet.jpg (Right floating accent) */}
      <div className="pointer-events-none absolute -right-12 bottom-8 hidden h-44 w-40 rotate-12 overflow-hidden border-2 border-charcoal bg-white shadow-[7px_7px_0_#111] md:block lg:right-8 lg:h-52 lg:w-48">
        <div className="relative h-32 w-full overflow-hidden lg:h-38">
          <Image
            src="/step-wallet.jpg"
            alt="Mobile wallet savings interface"
            fill
            sizes="192px"
            className="object-cover"
          />
        </div>
        <div className="border-t-2 border-charcoal bg-sky px-2.5 py-1.5 text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal">
            📱 Start In 60 Seconds
          </p>
        </div>
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#765500]">
            Get started
          </p>
          <h2 className="mt-5 text-[2rem] font-semibold leading-[1.15] tracking-tight text-charcoal sm:text-4xl lg:text-[2.75rem]">
            Make the next circle count.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-7 text-charcoal/80">
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
