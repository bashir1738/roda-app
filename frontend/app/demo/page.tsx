import type { Metadata } from "next";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { Container } from "../../components/ui";
import {
  PlayIcon,
  DownloadIcon,
  ExternalLinkIcon,
  BookOpenIcon,
} from "../../components/icons";

export const metadata: Metadata = {
  title: "Demo Video & On-Chain Proofs — Roda",
  description:
    "Watch the complete 2-minute walkthrough of Roda on NEAR Protocol, covering rotating circles, solo vaults, Sputnik DAO coordination, budget envelopes, and live testnet transactions.",
};

const VERIFIED_TXS = [
  {
    flow: "Create Circle (USDC)",
    method: "create_circle",
    hash: "EcKftJQVGwUWs4u7ZkAKiQvXNSqzJNpzXMygrZpyfY3p",
    desc: "Initializes rotating savings pool with USDC contribution, 10-minute/weekly cadence, and reputation gate.",
  },
  {
    flow: "Join Circle",
    method: "join_circle",
    hash: "8QgsLGeH6om1XjEeCpsFepAgp2wSpyQTMASGZAUjS4FR",
    desc: "Verifies minimum reputation threshold and registers member seat in join order.",
  },
  {
    flow: "Circle Contribution (+ Rep)",
    method: "ft_transfer_call (contribute)",
    hash: "HsbnszKRkCnr9jLPThk8J7mS4FDx9CNx1h1mGC9vaKs8",
    desc: "Deposits Circle USDC via NEP-141 call; updates on-chain reputation score and emits NEP-297 event.",
  },
  {
    flow: "Claim Circle Payout",
    method: "claim_payout",
    hash: "Ch6YdRWGNaQPfBXLYLk9MDyvFqvTyVkE89vocDdbaB4w",
    desc: "Deterministic round payout to designated recipient with flat 0.3% protocol fee and automated reward evaluation.",
  },
  {
    flow: "Create Solo Vault",
    method: "create_vault",
    hash: "J3LbETEbJQEpjKaRZJCm9PYcnV2qwdcSE95uKi1TE8bU",
    desc: "Locks USDC for disciplined personal savings across 5 deterministic tiers (Flex to 1-Year).",
  },
  {
    flow: "Create Community",
    method: "create_community",
    hash: "GXbXNfhbGamJS3pGoVevKhtvPiGa1hRv1tUAAcCEQ2yZ",
    desc: "Stages community treasury with up to 12 budget envelopes awaiting Sputnik DAO governance confirmation.",
  },
  {
    flow: "Link Sputnik DAO",
    method: "confirm_link (via DAO Proposal)",
    hash: "CkJaEMCS8PTocgWVuJ6Rb4App1tDJd6AdvDX2NdrBdjh",
    desc: "Two-step governance handshake: Sputnik DAO council executes FunctionCall proposal proving consent.",
  },
  {
    flow: "Budget Deposit (+ Shares)",
    method: "ft_transfer_call (budget_deposit)",
    hash: "8HS5UVWc3yvZGSmQapnZ6MoNPu8hNUM89TMB8eQXDYBj",
    desc: "Deposits USDC into escrow; automatically mints proportional collective ownership shares (1 micro-USDC = 1 share).",
  },
  {
    flow: "Approved Community Spend",
    method: "community_spend (via DAO Proposal)",
    hash: "F4Chz96XZQ18N9hnvLxC9yPqG2wuR7wJeF4K4fmqSbqy",
    desc: "Council approves envelope spend; contract strictly enforces hard budget cap with ExceedsEnvelope safety.",
  },
  {
    flow: "Create Reward Rule",
    method: "create_reward_rule (via DAO Proposal)",
    hash: "D5iGyYsz9ubcFYRzXh2js7tiV2HgtaUpJbkP9CN3zLUV",
    desc: "DAO attaches automated payout rule rewarding savers upon completing circles or maintaining streaks.",
  },
  {
    flow: "Grant Community Shares",
    method: "grant_shares (via DAO Proposal)",
    hash: "283fkej3vbVVZWWdhyUUTkvVHTeXeBj1T3rMyT1DhKK3",
    desc: "Issues collective governance equity granting pro-rata dissolution surplus rights (claim_surplus).",
  },
];

const CHAPTERS = [
  { time: "0:00", title: "Non-Custodial Multi-Wallet Engine", desc: "Local Ed25519 SecureStore, Magic OTP, Meteor, and HERE Wallet." },
  { time: "0:35", title: "Rotating Savings Circles (Ajo / Esusu)", desc: "Invite codes, fixed USDC contributions, and reputation gating." },
  { time: "1:05", title: "Automated USDC Settlement & Payouts", desc: "Fail-safe NEP-141 transfers with atomic async rollback protection." },
  { time: "1:30", title: "Solo Savings Vaults", desc: "Disciplined personal saving across 5 lock tiers with 1:1 principal safety." },
  { time: "1:50", title: "Sputnik DAO & Budget Envelopes", desc: "Split-custody governance, hard-capped envelopes, and Trezu readiness." },
];

export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface-sand pb-24">
        {/* Header */}
        <section className="border-b-2 border-charcoal bg-[#FFFDF8] pt-14 pb-12 sm:pt-20 sm:pb-16">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 border-2 border-charcoal bg-[#FFD166] px-3.5 py-1 text-[12px] font-bold text-charcoal shadow-[3px_3px_0_#111]">
                <PlayIcon className="h-3.5 w-3.5 fill-charcoal" />
                OFFICIAL PRODUCT DEMO
              </div>

              <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.1] tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
                Roda in Action
              </h1>

              <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-lg">
                Watch the 60-second product overview below, or click through to watch the full walkthrough on X (Twitter).
              </p>

              {/* Action Buttons */}
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
                  href="/docs"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-white px-6 text-sm font-bold text-charcoal shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-sand"
                >
                  <BookOpenIcon className="h-4 w-4" />
                  Read Documentation
                </a>

                <a
                  href="https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-white px-6 text-sm font-bold text-charcoal shadow-[4px_4px_0_#111] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-surface-sand"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Testnet Contract
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Video Player Section */}
        <section className="py-12 sm:py-16">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="relative overflow-hidden rounded-2xl border-2 sm:border-4 border-charcoal bg-black shadow-[6px_6px_0_#111] sm:shadow-[12px_12px_0_#111]">
                <video
                  className="w-full aspect-[120/67] max-h-[640px] object-contain bg-black"
                  controls
                  playsInline
                  preload="metadata"
                  src="/Roda_60s_Overview.mp4"
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Full Demo Banner on X */}
              <div className="mt-8 rounded-2xl border-2 border-charcoal bg-[#FFD166] p-6 shadow-[6px_6px_0_#111]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <span className="inline-block rounded border border-charcoal bg-black px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Extended Walkthrough
                    </span>
                    <h3 className="text-xl font-extrabold text-charcoal sm:text-2xl">
                      Watch the Full Product Demo on X
                    </h3>
                    <p className="text-sm font-medium text-charcoal/80">
                      View the complete mobile walkthrough thread with live interactions and design rationale.
                    </p>
                  </div>
                  <a
                    href="https://x.com/0xbash1738/status/2120867102932320511"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-charcoal bg-black px-6 py-3.5 text-sm font-bold text-white shadow-[3px_3px_0_#fff] transition hover:-translate-y-0.5 hover:bg-zinc-800"
                  >
                    <span>Watch on X (Twitter)</span>
                    <ExternalLinkIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Video Specs Banner */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-charcoal bg-white p-4 shadow-[4px_4px_0_#111]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-[#00C08B]" />
                  <span className="text-[13px] font-bold text-charcoal">
                    Full HD (1920×1072) · 60s Overview · Circle USDC Testnet
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="/Roda_60s_Overview.mp4"
                    download="Roda_60s_Overview.mp4"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-charcoal underline hover:text-[#00C08B]"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Download 60s MP4
                  </a>
                  <span className="text-muted">·</span>
                  <a
                    href="https://github.com/bashir1738/roda-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-charcoal underline hover:text-[#00C08B]"
                  >
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                    GitHub Source
                  </a>
                </div>
              </div>

              {/* Chapter Breakdown */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold tracking-tight text-charcoal">
                  Walkthrough Chapters
                </h3>
                <p className="mt-1 text-sm text-muted">
                  Follow along each component showcased in the mobile preview:
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex flex-col justify-center rounded-xl border-2 border-dashed border-charcoal/40 bg-[#9BE7B2]/30 p-4">
                    <span className="text-[12px] font-bold text-charcoal">Trezu (Mainnet Only)</span>
                    <p className="mt-1 text-[11px] text-muted">
                      Every community DAO is fully standard; opens directly in <span className="font-mono text-[10px]">trezu.app/&lt;dao&gt;</span> on mainnet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified On-Chain Transactions */}
              <div className="mt-16">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-charcoal pb-4">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight text-charcoal">
                      Live Testnet Receipts (NearBlocks)
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      Every contract call performed in Roda can be independently verified on NEAR Testnet:
                    </p>
                  </div>
                  <span className="rounded border border-charcoal bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-charcoal shadow-[2px_2px_0_#111]">
                    Program: roda.dev-92ebb0b3c42c.testnet
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {VERIFIED_TXS.map((tx, idx) => (
                    <div
                      key={tx.hash}
                      className="flex flex-col gap-3 rounded-xl border-2 border-charcoal bg-white p-4 shadow-[4px_4px_0_#111] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00C08B] text-[10px] font-bold text-black">
                            {idx + 1}
                          </span>
                          <span className="text-[14px] font-bold text-charcoal">{tx.flow}</span>
                          <span className="rounded border border-charcoal/30 bg-surface-sand px-1.5 py-0.5 font-mono text-[11px] text-charcoal break-all">
                            {tx.method}
                          </span>
                        </div>
                        <p className="text-[12px] text-muted sm:pl-7">{tx.desc}</p>
                      </div>

                      <a
                        href={`https://testnet.nearblocks.io/txns/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-charcoal bg-[#FFFDF8] px-3 py-1.5 font-mono text-[11px] font-bold text-charcoal transition hover:bg-[#00C08B] hover:text-black sm:self-center"
                      >
                        {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
