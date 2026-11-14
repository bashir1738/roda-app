"use client";

import { useState } from "react";
import { Logo } from "./Logo";
import { GetAppButton } from "./GetAppModal";
import { CloseIcon, PlayIcon } from "./icons";

const LINKS = [
  { label: "Circles", href: "/#circles" },
  { label: "Community", href: "/#community" },
  { label: "Vaults", href: "/#vaults" },
  { label: "How it works", href: "/#how" },
  { label: "Demo", href: "/demo" },
  { label: "Docs", href: "/docs" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-charcoal bg-surface-sand/95 backdrop-blur-md">
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

        <div className="flex items-center gap-3">
          <a
            href="/demo"
            className="hidden items-center gap-1.5 rounded-lg border-2 border-charcoal bg-[#FFD166] px-3.5 py-2 text-xs font-bold text-charcoal shadow-[2px_2px_0_#111] transition hover:-translate-y-0.5 hover:bg-[#ffe08a] md:inline-flex"
          >
            <PlayIcon className="h-3.5 w-3.5 fill-charcoal" />
            Watch Demo
          </a>
          <GetAppButton
            className="hidden !bg-[#00C08B] hover:!bg-[#1AD9A4] md:inline-flex"
          >
            Get the app
          </GetAppButton>
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
        <div className="border-t border-charcoal bg-surface-sand px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base font-semibold text-charcoal transition-colors hover:text-[#00C08B]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3 border-t border-charcoal/20 pt-4">
            <a
              href="/demo"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-[#FFD166] px-4 text-sm font-bold text-charcoal shadow-[3px_3px_0_#111]"
            >
              <PlayIcon className="h-4 w-4 fill-charcoal" />
              Watch Demo Video
            </a>
            <GetAppButton
              className="w-full !bg-[#00C08B] hover:!bg-[#1AD9A4]"
            >
              Get the app
            </GetAppButton>
          </div>
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
