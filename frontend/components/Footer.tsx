import { Logo } from "./Logo";

const FOOTER_NAV = [
  {
    title: "Product",
    links: [
      { label: "Circles", href: "#circles" },
      { label: "Community DAOs", href: "#community" },
      { label: "Vaults", href: "#vaults" },
      { label: "App", href: "#cta" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Security", href: "#security" },
      { label: "NEAR", href: "#security" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Licenses", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-charcoal bg-[#9BE7B2] pb-12 pt-16 sm:pt-20">
      <div className="mx-auto w-full max-w-8xl px-6 sm:px-10 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-20">
          <div>
            <a href="#" aria-label="Roda home">
              <Logo />
            </a>
            <p className="mt-4 max-w-xs text-[13px] leading-6 text-muted">
              Rotating savings circles, onchain. Automated payouts. Your keys.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {FOOTER_NAV.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-charcoal transition-colors hover:text-muted"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-border-subtle pt-8 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Roda</p>
          <p>Save together, grow together.</p>
        </div>
      </div>
    </footer>
  );
}
