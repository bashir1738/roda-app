"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { GetAppButton } from "./GetAppModal";
import { CloseIcon } from "./icons";

const LINKS = [
  { label: "Circles", href: "#circles" },
  { label: "Vaults", href: "#vaults" },
  { label: "How it works", href: "#how" },
  { label: "Security", href: "#security" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-8xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <a href="#" aria-label="Roda home">
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[13px] text-muted transition-colors hover:text-charcoal"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <GetAppButton className="hidden md:inline-flex">Get the app</GetAppButton>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuGlyph />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border-subtle bg-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-charcoal"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
