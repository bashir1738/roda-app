const TICKER_ITEMS = [
  "No account or maintenance fees",
  "Automated rotating payouts",
  "Sputnik DAO + Trezu ready",
  "Hard-capped budget envelopes",
  "Capital-weighted reputation",
  "One flat 0.3% payout fee",
  "Bounties & auto-rewards",
  "Non-custodial by design",
];

export function MarqueeTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <section className="overflow-hidden border-y border-border-subtle bg-surface-sand py-5">
      <div className="relative flex w-full select-none overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />

        <div className="animate-marquee-left flex items-center gap-10 whitespace-nowrap">
          {items.map((text, idx) => (
            <span key={idx} className={`flex items-center gap-10 border-2 border-charcoal px-3 py-1 text-[13px] font-bold text-charcoal ${
              idx % 4 === 0 ? "bg-butter" : idx % 4 === 1 ? "bg-blush" : idx % 4 === 2 ? "bg-sky" : "bg-[#9BE7B2]"
            }`}>
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
