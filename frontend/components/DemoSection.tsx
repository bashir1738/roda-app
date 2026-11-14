"use client";

import { Container, Section } from "./ui";
import { PlayIcon, DownloadIcon, ExternalLinkIcon, BookOpenIcon } from "./icons";

const CHAPTERS = [
  { time: "0:00", title: "Non-Custodial Multi-Wallet Engine", desc: "Local Ed25519 SecureStore, Magic OTP, Meteor, and HERE Wallet." },
  { time: "0:35", title: "Rotating Savings Circles (Ajo / Esusu)", desc: "Invite codes, fixed USDC contributions, and reputation gating." },
  { time: "1:05", title: "Automated USDC Settlement & Payouts", desc: "Fail-safe NEP-141 transfers with atomic async rollback protection." },
  { time: "1:30", title: "Solo Savings Vaults", desc: "Disciplined personal saving across 5 lock tiers with 1:1 principal safety." },
  { time: "1:50", title: "Sputnik DAO & Budget Envelopes", desc: "Split-custody governance, hard-capped envelopes, and Trezu readiness." },
];

export function DemoSection() {
  return (
    <Section id="demo" className="relative border-b-2 border-charcoal bg-[#FFFDF8]">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 border-2 border-charcoal bg-[#FFD166] px-3.5 py-1 text-[12px] font-bold text-charcoal shadow-[3px_3px_0_#111]">
            <PlayIcon className="h-3.5 w-3.5 fill-charcoal" />
            60-SECOND PRODUCT OVERVIEW
          </div>

          <h2 className="mt-4 text-[2.25rem] font-bold leading-tight tracking-tight text-charcoal sm:text-5xl">
            Watch Roda in Action
          </h2>

          <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-lg">
            See how non-custodial mobile keys, rotating savings circles, solo vaults, and Sputnik DAO multi-sig coordination work together seamlessly on NEAR.
          </p>
        </div>

        {/* Video Player Card */}
        <div className="mt-12 mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl border-2 sm:border-4 border-charcoal bg-black shadow-[6px_6px_0_#111] sm:shadow-[10px_10px_0_#111]">
            <video
              className="w-full aspect-[120/67] max-h-[520px] object-contain bg-black"
              controls
              playsInline
              preload="metadata"
              poster="/overview-preview.png"
              src="/video_2026-11-14_10-51-32.mp4"
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://x.com/0xbash1738/status/2120867102932320511"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-black px-6 text-sm font-bold text-white shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-zinc-800"
            >
              <span>Watch Full Demo on X</span>
              <ExternalLinkIcon className="h-4 w-4" />
            </a>

            <a
              href="https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-[#00C08B] px-6 text-sm font-bold text-black shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#1AD9A4]"
            >
              <DownloadIcon className="h-4 w-4" />
              Download Android Preview APK
            </a>

            <a
              href="/demo"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-[#FFD166] px-6 text-sm font-bold text-charcoal shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#ffe08a]"
            >
              <PlayIcon className="h-4 w-4 fill-charcoal" />
              Full Demo Page & Proofs
            </a>

            <a
              href="/docs"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-white px-6 text-sm font-bold text-charcoal shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-sand"
            >
              <BookOpenIcon className="h-4 w-4" />
              Interactive Docs
            </a>

            <a
              href="https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-white px-6 text-sm font-bold text-charcoal shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-sand"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Contract on NearBlocks
            </a>
          </div>

          {/* Chapters Grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CHAPTERS.map((c) => (
              <div
                key={c.time}
                className="rounded-xl border-2 border-charcoal bg-white p-4 shadow-[4px_4px_0_#111]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded border border-charcoal bg-[#00C08B] px-2 py-0.5 font-mono text-[11px] font-bold text-black">
                    {c.time}
                  </span>
                  <span className="text-[13px] font-bold text-charcoal truncate">{c.title}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-muted">{c.desc}</p>
              </div>
            ))}
            <div className="flex flex-col justify-center rounded-xl border-2 border-dashed border-charcoal/40 bg-white/60 p-4">
              <span className="text-[12px] font-bold text-charcoal">Verified on NEAR Testnet</span>
              <p className="mt-1 text-[11px] text-muted">
                Every flow in this video was executed live on <span className="font-mono text-[10px]">roda.dev-92ebb0b3c42c.testnet</span>.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
