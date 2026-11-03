const TICKER_ITEMS = [
  "No account or maintenance fees",
  "Automated rotating payouts",
  "Smart contract secured",
  "One flat 0.3% payout fee",
  "Transparent on-chain ROSCA",
  "Non-custodial by design",
];

export function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="overflow-hidden border-y border-border-subtle py-5">
      <div className="relative flex w-full select-none overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="animate-marquee-left flex items-center gap-10 whitespace-nowrap">
          {items.map((text, idx) => (
            <span key={idx} className="flex items-center gap-10 text-[13px] text-muted">
              {text}
              <span className="h-[3px] w-[3px] rounded-full bg-border-subtle" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
