import type { Metadata } from "next";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { Container } from "../../components/ui";
import {
  BookOpenIcon,
  PlayIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from "../../components/icons";

export const metadata: Metadata = {
  title: "Documentation — Roda",
  description:
    "Comprehensive guide and technical specification for Roda on NEAR Protocol: rotating savings circles, solo vaults, Sputnik DAO community coordination, budget envelopes, and reputation engine.",
};

const DOCS_NAV = [
  { id: "overview", label: "1. Overview & Architecture" },
  { id: "circles", label: "2. Rotating Savings Circles" },
  { id: "reputation", label: "3. Trust & Reputation Engine" },
  { id: "vaults", label: "4. Solo Savings Vaults" },
  { id: "community", label: "5. Sputnik DAO & Trezu" },
  { id: "envelopes", label: "6. Budget Envelopes" },
  { id: "rewards", label: "7. Rewards & Shares" },
  { id: "contracts", label: "8. Contract Specification" },
  { id: "security", label: "9. Multi-Wallet Security" },
  { id: "testnet", label: "10. Testnet Verification" },
];

export default function DocsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-surface-sand pb-24">
        {/* Header */}
        <section className="border-b-2 border-charcoal bg-[#FFFDF8] pt-14 pb-12 sm:pt-20 sm:pb-16">
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 border-2 border-charcoal bg-[#9BE7B2] px-3.5 py-1 text-[12px] font-bold text-charcoal shadow-[3px_3px_0_#111]">
                <BookOpenIcon className="h-3.5 w-3.5" />
                TECHNICAL DOCUMENTATION
              </div>

              <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.1] tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
                Roda Protocol Docs
              </h1>

              <p className="mt-4 text-[16px] leading-relaxed text-muted sm:text-lg">
                The complete developer and architecture guide for Roda on NEAR Protocol — covering rotating circles, solo vaults, Sputnik DAO integration, and verifiable on-chain reputation.
              </p>

              {/* Quick links */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/demo"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-[#FFD166] px-5 text-sm font-bold text-charcoal shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 hover:bg-[#ffe08a]"
                >
                  <PlayIcon className="h-4 w-4 fill-charcoal" />
                  Watch Demo Video
                </a>
                <a
                  href="https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-[#00C08B] px-5 text-sm font-bold text-black shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 hover:bg-[#1AD9A4]"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download APK
                </a>
                <a
                  href="https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-charcoal bg-white px-5 text-sm font-bold text-charcoal shadow-[3px_3px_0_#111] transition hover:-translate-y-0.5 hover:bg-surface-sand"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  Testnet Contract
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Content Layout */}
        <Container className="pt-12">
          <div className="grid gap-12 lg:grid-cols-[260px_1fr]">
            {/* Sidebar Navigation */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border-2 border-charcoal bg-white p-5 shadow-[4px_4px_0_#111]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Navigation
                </p>
                <nav className="mt-4 flex flex-col space-y-2">
                  {DOCS_NAV.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-charcoal transition hover:bg-[#00C08B]/20 hover:text-black"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>

                <div className="mt-6 border-t-2 border-charcoal/20 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    Quick Links
                  </p>
                  <div className="mt-3 flex flex-col space-y-2 text-[12px] font-bold">
                    <a href="/demo" className="text-charcoal hover:underline">
                      📹 Demo Video
                    </a>
                    <a
                      href="https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-charcoal hover:underline"
                    >
                      📱 Download Android APK
                    </a>
                    <a
                      href="https://github.com/bashir1738/roda-app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-charcoal hover:underline"
                    >
                      💻 GitHub Repository
                    </a>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Documentation Body */}
            <div className="space-y-12 sm:space-y-16 max-w-3xl min-w-0">
              {/* Mobile Quick Navigation */}
              <div className="lg:hidden rounded-xl border-2 border-charcoal bg-white p-4 shadow-[4px_4px_0_#111]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
                  Jump to Section
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DOCS_NAV.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="rounded-md border border-charcoal/30 bg-surface-sand px-2.5 py-1 text-[11px] font-bold text-charcoal hover:bg-[#00C08B] hover:text-black transition"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* 1. Overview */}
              <section id="overview" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  1. Overview & Architecture
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  <strong>Roda&apos;s edge is breadth and polish: circles that grow into community wallets, with trust that unlocks more.</strong> It unites rotating savings and credit associations (ROSCAs), personal USDC vaults, and Sputnik DAO multi-sig coordination into one coherent protocol on NEAR.
                </p>

                <div className="mt-6 rounded-xl border border-charcoal bg-surface-sand p-4 font-mono text-[13px] leading-relaxed">
                  <p className="font-bold text-charcoal">Custody Architecture:</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-charcoal/80">
                    <li><strong>Circles & Vaults</strong>: Program-owned escrow on <span className="bg-white px-1 border border-charcoal/30">roda.dev-92ebb0b3c42c.testnet</span> with deterministic rules.</li>
                    <li><strong>Community DAOs</strong>: Standard <span className="bg-white px-1 border border-charcoal/30">sputnikv2.testnet</span> contracts created through factory subaccounts.</li>
                    <li><strong>Budget Envelopes</strong>: Roda escrow earmarks up to 12 spend envelopes, unlocked only by approved DAO Call proposals.</li>
                  </ul>
                </div>
              </section>

              {/* 2. Circles */}
              <section id="circles" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  2. Rotating Savings Circles (Ajo / Esusu)
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Traditional savings groups pool money periodically and disburse the lump sum to each member in turn. Roda eliminates organizer default through smart contract enforcement:
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-lg border border-charcoal/30 bg-[#FFFDF8] p-4">
                    <p className="font-bold text-[14px] text-charcoal">Step 1 — Circle Creation</p>
                    <p className="text-[13px] text-muted mt-1">
                      Creator calls <code className="font-mono text-xs bg-surface-sand px-1">create_circle</code> specifying contribution amount (Circle USDC), member size (2–12), round cadence (10 minutes on testnet, weekly/monthly on mainnet), and optional <code className="font-mono text-xs bg-surface-sand px-1">min_reputation</code>. A 6-digit invite code is generated.
                    </p>
                  </div>
                  <div className="rounded-lg border border-charcoal/30 bg-[#FFFDF8] p-4">
                    <p className="font-bold text-[14px] text-charcoal">Step 2 — Join via Code</p>
                    <p className="text-[13px] text-muted mt-1">
                      Members enter the invite code and call <code className="font-mono text-xs bg-surface-sand px-1">join_circle</code>. If the circle requires minimum reputation, accounts below the threshold are rejected with <code className="font-mono text-xs bg-surface-sand px-1">InsufficientReputation</code>.
                    </p>
                  </div>
                  <div className="rounded-lg border border-charcoal/30 bg-[#FFFDF8] p-4">
                    <p className="font-bold text-[14px] text-charcoal">Step 3 — Round Contributions & Payouts</p>
                    <p className="text-[13px] text-muted mt-1">
                      Each round, members send USDC via <code className="font-mono text-xs bg-surface-sand px-1">ft_transfer_call</code>. When all members have paid and the time interval passes, <code className="font-mono text-xs bg-surface-sand px-1">claim_payout</code> disburses the pool to the designated recipient minus a 0.3% protocol fee.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Reputation */}
              <section id="reputation" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  3. Trust & Reputation Engine (0–1000)
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Reputation on Roda is strictly capital-weighted and Sybil-resistant. Empty or newly created accounts score 0. Score increments require real USDC at risk:
                </p>

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-[13px] border border-charcoal">
                    <thead className="bg-[#9BE7B2] font-bold text-black border-b border-charcoal">
                      <tr>
                        <th className="p-3">Activity</th>
                        <th className="p-3">Weight</th>
                        <th className="p-3">Cap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/20">
                      <tr>
                        <td className="p-3 font-semibold">On-time circle contributions</td>
                        <td className="p-3">+10 pts per on-time payment</td>
                        <td className="p-3">300 pts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Completed circle cycles</td>
                        <td className="p-3">+50 pts per completed circle</td>
                        <td className="p-3">250 pts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Matured solo vault withdrawals</td>
                        <td className="p-3">+25 pts per locked tier completed</td>
                        <td className="p-3">200 pts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Community budget deposits</td>
                        <td className="p-3">+1 pt per $1 USDC deposited</td>
                        <td className="p-3">150 pts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold">Account tenure</td>
                        <td className="p-3">+1 pt per 3 days active</td>
                        <td className="p-3">100 pts</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. Vaults */}
              <section id="vaults" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  4. Solo Savings Vaults
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Solo vaults enforce disciplined savings by locking funds until a target duration passes. Principal is 100% safeguarded (yield is planned for mainnet):
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { tier: "Tier 0", name: "Flex Solo", lock: "0 days", desc: "Deposit & withdraw anytime." },
                    { tier: "Tier 1", name: "Weekly Solo", lock: "7 days", desc: "Short-term lock for weekly habits." },
                    { tier: "Tier 2", name: "Monthly Solo", lock: "30 days", desc: "Monthly pay-yourself-first lock." },
                    { tier: "Tier 3", name: "6-Month Solo", lock: "182 days", desc: "Mid-term emergency cushion." },
                    { tier: "Tier 4", name: "1-Year Solo", lock: "365 days", desc: "Long-term milestone savings." },
                  ].map((v) => (
                    <div key={v.tier} className="rounded-lg border border-charcoal bg-surface-sand p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-charcoal">{v.name}</span>
                        <span className="font-mono text-xs text-muted">{v.lock}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Sputnik DAO & Trezu */}
              <section id="community" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  5. Sputnik DAO & Trezu Coordination
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Rather than reinventing a custom multi-sig, Roda links directly to <strong>Sputnik DAO</strong> (<code className="font-mono text-xs bg-surface-sand px-1">sputnikv2.testnet</code> / <code className="font-mono text-xs bg-surface-sand px-1">sputnik-dao.near</code>):
                </p>

                <ul className="mt-4 space-y-2 text-[14px] text-muted list-disc pl-5">
                  <li><strong>Two-Step Linking</strong>: Creator registers community on Roda (<code className="font-mono text-xs">create_community</code>), then the Sputnik DAO council executes a FunctionCall proposal calling <code className="font-mono text-xs">confirm_link</code> to prove governance consent.</li>
                  <li><strong>Trezu (Mainnet Only)</strong>: Every Roda community DAO is a standard Sputnik DAO that natively opens in Trezu (<code className="font-mono text-xs">trezu.app/&lt;dao&gt;</code>) on mainnet for bulk payroll, swaps, and reporting.</li>
                </ul>
              </section>

              {/* 6. Envelopes */}
              <section id="envelopes" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  6. Budget Envelopes & Spend Caps
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Communities can organize funds into up to 12 named budget envelopes (e.g., Marketing, Dev Bounties, Events). Funds are deposited via <code className="font-mono text-xs bg-surface-sand px-1">ft_transfer_call</code> and allocated via DAO vote.
                </p>
                <div className="mt-4 rounded-xl border border-charcoal bg-butter/30 p-4 text-[13px] text-charcoal">
                  <strong>Hard Spend Protection:</strong> When <code className="font-mono text-xs">community_spend</code> is called, the smart contract verifies that <code className="font-mono text-xs">spent + amount &lt;= allocated</code>. If the proposal attempts to spend more than the envelope holds, the transaction aborts with <code className="font-mono text-xs font-bold">ExceedsEnvelope</code>.
                </div>
              </section>

              {/* 7. Rewards & Shares */}
              <section id="rewards" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  7. Programmable Rewards & Collective Shares
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  DAOs can incentivize good savings habits and grant collective ownership:
                </p>
                <ul className="mt-4 space-y-2 text-[14px] text-muted list-disc pl-5">
                  <li><strong>Reward Rules</strong>: Automatic payouts triggered on saver streaks or completed circles.</li>
                  <li><strong>Collective Shares</strong>: Budget deposits automatically mint 1 micro-USDC = 1 share. DAOs can also grant merit shares via <code className="font-mono text-xs">grant_shares</code>.</li>
                  <li><strong>Dissolution Surplus</strong>: If a community dissolves, <code className="font-mono text-xs">claim_surplus</code> distributes remaining escrow USDC pro-rata to shareholders.</li>
                </ul>
              </section>

              {/* 8. Contract Specification */}
              <section id="contracts" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  8. Smart Contract Reference
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Built in Rust with <code className="font-mono text-xs bg-surface-sand px-1">near-sdk 5.x</code> on NEAR Protocol:
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-lg border border-charcoal bg-surface-sand p-4 overflow-x-auto">
                    <p className="font-mono text-xs font-bold text-charcoal break-words">create_circle(name, contribution, interval_secs, max_members, min_reputation) -&gt; u64</p>
                    <p className="mt-1 text-xs text-muted">Creates a rotating circle and returns its unique 6-digit invitation code.</p>
                  </div>
                  <div className="rounded-lg border border-charcoal bg-surface-sand p-4 overflow-x-auto">
                    <p className="font-mono text-xs font-bold text-charcoal break-words">ft_on_transfer(sender_id, amount, msg) -&gt; PromiseOrValue&lt;U128&gt;</p>
                    <p className="mt-1 text-xs text-muted">Receives Circle USDC with JSON messages for &apos;contribute&apos;, &apos;deposit&apos;, or &apos;budget_deposit&apos;.</p>
                  </div>
                  <div className="rounded-lg border border-charcoal bg-surface-sand p-4 overflow-x-auto">
                    <p className="font-mono text-xs font-bold text-charcoal break-words">claim_payout(circle_code) -&gt; Promise</p>
                    <p className="mt-1 text-xs text-muted">Disburses round funds to the scheduled member via fail-safe async callback.</p>
                  </div>
                  <div className="rounded-lg border border-charcoal bg-surface-sand p-4 overflow-x-auto">
                    <p className="font-mono text-xs font-bold text-charcoal break-words">confirm_link(community_id)</p>
                    <p className="mt-1 text-xs text-muted">Called by Sputnik DAO predecessor via proposal to activate community escrow.</p>
                  </div>
                  <div className="rounded-lg border border-charcoal bg-surface-sand p-4 overflow-x-auto">
                    <p className="font-mono text-xs font-bold text-charcoal break-words">community_spend(community_id, envelope_id, recipient, amount)</p>
                    <p className="mt-1 text-xs text-muted">Enforces budget envelope caps before transferring USDC to recipient.</p>
                  </div>
                </div>
              </section>

              {/* 9. Security */}
              <section id="security" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  9. Multi-Wallet Security Model
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Roda is 100% non-custodial. Private keys never leave the user&apos;s device:
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-charcoal bg-white p-4">
                    <p className="font-bold text-sm text-charcoal">Expo SecureStore</p>
                    <p className="text-xs text-muted mt-1">
                      Hardware-backed keychain (iOS Keychain / Android Keystore) stores the Ed25519 signing key.
                    </p>
                  </div>
                  <div className="rounded-xl border border-charcoal bg-white p-4">
                    <p className="font-bold text-sm text-charcoal">Magic OTP + Recovery</p>
                    <p className="text-xs text-muted mt-1">
                      Passwordless email authentication with encrypted key backup for seamless recovery.
                    </p>
                  </div>
                  <div className="rounded-xl border border-charcoal bg-white p-4">
                    <p className="font-bold text-sm text-charcoal">Meteor / MyNearWallet</p>
                    <p className="text-xs text-muted mt-1">
                      Connect existing NEAR Web3 wallets via deep links and session signing.
                    </p>
                  </div>
                  <div className="rounded-xl border border-charcoal bg-white p-4">
                    <p className="font-bold text-sm text-charcoal">Atomic Async Rollbacks</p>
                    <p className="text-xs text-muted mt-1">
                      NEAR promise callbacks (<code className="font-mono text-xs">on_payout</code>, <code className="font-mono text-xs">on_spend</code>) restore state if transfers fail.
                    </p>
                  </div>
                </div>
              </section>

              {/* 10. Testnet */}
              <section id="testnet" className="scroll-mt-24 rounded-2xl border-2 border-charcoal bg-white p-6 sm:p-8 shadow-[6px_6px_0_#111]">
                <h2 className="text-2xl font-bold text-charcoal sm:text-3xl">
                  10. Testnet Verification
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">
                  Deployments are live and active on NEAR Testnet:
                </p>

                <div className="mt-4 space-y-2 font-mono text-xs">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between rounded border border-charcoal bg-surface-sand p-3">
                    <span className="font-bold shrink-0">Roda Program:</span>
                    <a
                      href="https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00C08B] underline break-all"
                    >
                      roda.dev-92ebb0b3c42c.testnet
                    </a>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between rounded border border-charcoal bg-surface-sand p-3">
                    <span className="font-bold shrink-0">Circle USDC Token:</span>
                    <a
                      href="https://testnet.nearblocks.io/token/3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00C08B] underline break-all font-mono text-[11px]"
                    >
                      3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af
                    </a>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between rounded border border-charcoal bg-surface-sand p-3">
                    <span className="font-bold shrink-0">Sputnik Factory:</span>
                    <a
                      href="https://testnet.nearblocks.io/address/sputnikv2.testnet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00C08B] underline break-all"
                    >
                      sputnikv2.testnet
                    </a>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
