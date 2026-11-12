# Roda

<p align="center">
  <strong>Rotating Savings &amp; Community Treasuries, Onchain</strong><br />
  <em>Digitalizing community savings, shared DAO budgets, and verifiable reputation on NEAR Protocol.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NEAR-Testnet-00C08B?style=flat-square&logo=near" alt="NEAR Testnet" />
  <img src="https://img.shields.io/badge/Contracts-Rust_%2F_near--sdk_5.x-DEA584?style=flat-square&logo=rust" alt="Rust Contracts" />
  <img src="https://img.shields.io/badge/Governance-Sputnik_DAO_%2B_Trezu_(mainnet_only)-111111?style=flat-square" alt="Sputnik DAO and Trezu (mainnet only)" />
  <img src="https://img.shields.io/badge/Mobile-Expo_%2F_React_Native-4630EB?style=flat-square&logo=expo" alt="Mobile Expo" />
  <img src="https://img.shields.io/badge/Frontend-Next.js_16-black?style=flat-square&logo=next.js" alt="Next.js Frontend" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [The Problem & The Solution](#the-problem--the-solution)
- [Why Roda Is Different](#why-roda-is-different)
- [Ecosystem & Track Fit](#ecosystem--track-fit)
- [Live on Testnet](#live-on-testnet)
- [Quick Check](#quick-check)
- [Core Features](#core-features)
  - [Rotating Savings Circles (Ajo / Esusu)](#rotating-savings-circles-ajo--esusu)
  - [Trust Unlocks More](#trust-unlocks-more)
  - [Solo Savings Vaults](#solo-savings-vaults)
  - [Community Coordination Layer (Sputnik DAO + Trezu (mainnet only))](#community-coordination-layer-sputnik-dao--trezu-mainnet-only)
  - [Bounties, Programmable Rewards & Collective Ownership](#bounties-programmable-rewards--collective-ownership)
  - [Non-Custodial Multi-Wallet Engine](#non-custodial-multi-wallet-engine)
  - [Onchain Username Registry](#onchain-username-registry)
  - [Mobile Demo Experience](#mobile-demo-experience)
- [Monorepo Architecture](#monorepo-architecture)
- [Smart Contract Specification](#smart-contract-specification)
- [Directory Structure](#directory-structure)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [Business Model & Roadmap](#business-model--roadmap)
- [Hackathon Scope](#hackathon-scope)
- [License](#license)

---

## Overview

**Roda** is a non-custodial mobile savings and community treasury platform built on **NEAR Protocol**. Its mobile experience is organized around five tabs — **Home, Circles, Community, Save, and Wallet** — combining rotating savings and credit associations (ROSCAs, known across Africa and the diaspora as *ajo*, *esusu*, or *adashe*), personal USDC vaults, community coordination, and wallet activity in one app.

By replacing human middlemen with deterministic smart contracts, Roda eliminates organizer default and opaque bookkeeping while letting growing communities scale into full multi-sig DAOs with hard-capped budget envelopes, capital-weighted on-chain reputation, programmable rewards, and collective ownership shares.

> **Live NEAR Testnet Program**: [`roda.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) · **Circle USDC (testnet)**: [`3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af`](https://testnet.nearblocks.io/token/3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af) · **Sputnik DAO Factory**: [`sputnikv2.testnet`](https://testnet.nearblocks.io/address/sputnikv2.testnet) · **Android APK**: [Download Preview Build](https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk)

---

## The Problem & The Solution

Traditional rotating savings clubs and community pots suffer from structural vulnerabilities:
1. **Organizer Risk**: Group organizers can disappear with pooled cash or manipulate payout orders.
2. **Default / Drop-out**: Members receive early payouts and stop contributing to subsequent rounds without consequence.
3. **Unchecked Treasury Spends**: Even with a multi-sig, treasuries lack hard program/project spending caps and automated circle incentives.
4. **No Portable Trust**: Savers who consistently honor commitments earn zero portable proof of creditworthiness.

**How Roda Fixes This**:
- **Trustless Circle & Vault Custody**: Roda smart contracts custody circle pools and solo vaults deterministically; no admin can withdraw or redirect user funds.
- **Sputnik DAO + Trezu (mainnet only) Compatibility**: Community operations stay inside standard Sputnik DAOs from the official factory (managed natively in mobile, and compatible with Trezu (mainnet only) at `trezu.app/<dao>`), while earmarked budgets sit in Roda escrow envelopes enforced with hard spending limits.
- **Capital-Weighted Reputation**: On-chain activity scores real USDC reliability and tenure (0–1000) to gate high-trust circles without centralized credit bureaus.

---

## Why Roda Is Different

Most savings apps stop at either informal group tracking or basic multi-sig wallets. Roda connects both in one mobile-first protocol:

- **ROSCA + DAO Split Custody**: Informal *ajo* / *esusu* apps rely on custodian trust, while generic DAOs lack structured recurring savings schedules and spend ceilings. Roda pairs deterministic circle custody with standard `sputnikv2` governance and hard-capped escrow envelopes (`ExceedsEnvelope`).
- **Capital-Weighted, Sybil-Resistant Reputation**: Unlike social or point-farming scores, Roda's `0–1000` reputation derives strictly from verified USDC capital at risk (on-time circle contributions, completed circles, matured vault withdrawals, and community deposits) plus calendar tenure. Empty accounts always score `0`.
- **Programmable Rewards & Pro-Rata Collective Ownership**: DAOs can attach automated USDC reward rules to circle milestones (`CircleRoundCompleted` / `Streak`), mint `1 micro-USDC = 1 share` on budget deposits, grant merit shares (`grant_shares`), and guarantee exact pro-rata `claim_surplus` rights on dissolution.
- **Atomic Async Rollbacks**: Every outbound `ft_transfer` uses NEAR promise callbacks (`on_withdraw`, `on_payout`, `on_spend`, `on_reward_transfer`, `on_claim_surplus`) so failed token transfers cleanly restore balances and flags without stuck funds.
- **Non-Custodial Multi-Wallet Onboarding**: Users can start in seconds with a local `Expo SecureStore` keypair or Magic Email OTP (with backup recovery) or connect Meteor, MyNearWallet, or HERE Wallet.

---

## Ecosystem & Track Fit

| Integration / Track | How Roda Uses It |
|:---|:---|
| **NEAR Protocol** | Rust / `near-sdk` 5.x smart contracts powering deterministic circle custody, solo vaults, community escrow, on-chain reputation, rewards, and NEP-297 events. |
| **Circle USDC** | Native NEP-141 stablecoin settlement via `ft_transfer_call` (`contribute`, `deposit`, `budget_deposit`) with fail-safe async payout rollbacks. |
| **Sputnik DAO** | Standard `sputnikv2` multi-sig governance for community creation, proposals, voting, native bounties, and strict `dao_id` predecessor authorization on community spends. |
| **Trezu (mainnet only)** | Every Roda community is a standard Sputnik DAO from the official factory, the same kind Trezu (mainnet only) manages. On mainnet, the community’s DAO opens in Trezu (mainnet only) (`trezu.app/<dao>`); on testnet, the hosted Trezu (mainnet only) app isn’t available, so the link is mainnet-only. |

---

## Live on Testnet

Verified transactions handled by [`roda.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) on NEAR Testnet:

| Flow | Contract Call / Receipt | Explorer Link |
|:---|:---|:---|
| **Create circle (Circle USDC)** | `create_circle` | [`EcKftJQVGw...pyfY3p`](https://testnet.nearblocks.io/txns/EcKftJQVGwUWs4u7ZkAKiQvXNSqzJNpzXMygrZpyfY3p) |
| **Join circle** | `join_circle` | [`8QgsLGeH6o...UjS4FR`](https://testnet.nearblocks.io/txns/8QgsLGeH6om1XjEeCpsFepAgp2wSpyQTMASGZAUjS4FR) |
| **Contribute to circle (+ reputation)** | `ft_transfer_call` (`contribute`) | [`HsbnszKRkC...9vaKs8`](https://testnet.nearblocks.io/txns/HsbnszKRkCnr9jLPThk8J7mS4FDx9CNx1h1mGC9vaKs8) |
| **Claim circle payout** | `claim_payout` | [`Ch6YdRWGNa...DdbaB4w`](https://testnet.nearblocks.io/txns/Ch6YdRWGNaQPfBXLYLk9MDyvFqvTyVkE89vocDdbaB4w) |
| **Create solo vault** | `create_vault` | [`J3LbETEbJQ...1TE8bU`](https://testnet.nearblocks.io/txns/J3LbETEbJQEpjKaRZJCm9PYcnV2qwdcSE95uKi1TE8bU) |
| **Create community** | `create_community` | [`GXbXNfhbGa...CEQ2yZ`](https://testnet.nearblocks.io/txns/GXbXNfhbGamJS3pGoVevKhtvPiGa1hRv1tUAAcCEQ2yZ) |
| **Link Sputnik DAO (DAO approved)** | `act_proposal` -> `confirm_link` | [`CkJaEMCS8P...rBdjh`](https://testnet.nearblocks.io/txns/CkJaEMCS8PTocgWVuJ6Rb4App1tDJd6AdvDX2NdrBdjh) |
| **Community budget deposit (+ shares & reputation)** | `ft_transfer_call` (`budget_deposit`) | [`8HS5UVWc3y...QXDYBj`](https://testnet.nearblocks.io/txns/8HS5UVWc3yvZGSmQapnZ6MoNPu8hNUM89TMB8eQXDYBj) |
| **Approved community spend (DAO approved)** | `act_proposal` -> `community_spend` | [`F4Chz96XZQ...mqSbqy`](https://testnet.nearblocks.io/txns/F4Chz96XZQ18N9hnvLxC9yPqG2wuR7wJeF4K4fmqSbqy) |
| **Create reward rule (DAO approved)** | `act_proposal` -> `create_reward_rule` | [`D5iGyYsz9u...N3zLUV`](https://testnet.nearblocks.io/txns/D5iGyYsz9ubcFYRzXh2js7tiV2HgtaUpJbkP9CN3zLUV) |
| **Grant community shares (DAO approved)** | `act_proposal` -> `grant_shares` | [`283fkej3vb...DhKK3`](https://testnet.nearblocks.io/txns/283fkej3vbVVZWWdhyUUTkvVHTeXeBj1T3rMyT1DhKK3) |

---

## Quick Check

Verify the deployed contract, view state, and local test suite in under two minutes:

1. **Inspect live testnet config via NEAR RPC** (returns `token_id` pointing at Circle USDC testnet and `faucet_enabled: false`):
   ```bash
   curl -s https://rpc.testnet.fastnear.com -H 'Content-Type: application/json' -d '{
     "jsonrpc":"2.0","id":"1","method":"query",
     "params":{"request_type":"call_function","finality":"final","account_id":"roda.dev-92ebb0b3c42c.testnet","method_name":"get_config","args_base64":"e30="}
   }'
   ```
2. **Run contract unit tests & off-chain invariant math**:
   ```bash
   cd program
   npm test
   ```
3. **Type-check the mobile client**:
   ```bash
   cd mobile
   npx tsc --noEmit
   ```
4. **Verify live on-chain receipts**: Click any transaction hash in [Live on Testnet](#live-on-testnet) to inspect NEP-297 `EVENT_JSON` logs (`ContributionMade`, `reputation_updated`, `envelope_spend`, `shares_minted`, `reward_rule_created`).
5. **Install the Android preview APK**: [Download Roda Testnet APK](https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk).

---

## Core Features

### Rotating Savings Circles (Ajo / Esusu)
- **Create a Circle**: Configure member size (2–12), fixed USDC contribution, cadence (10 minutes, weekly, bi-weekly, or monthly), optional minimum on-chain reputation gate, and a 6-digit invite code.
- **Join via Code**: Members inspect reputation requirements and join directly from mobile.
- **Round Contributions & Payouts**: Contributions settle via `ft_transfer_call`. Once every member pays and the round interval elapses, the designated recipient claims the pool (with a flat 0.3% protocol fee and automatic reward rule evaluation).

### Trust Unlocks More

Reputation in Roda is earned, not bought. Every on-time circle contribution, completed circle, matured vault and community deposit raises your on-chain score (0–1000), weighted by real money at risk, so empty accounts score 0.

That trust unlocks access:
- Circles can require a minimum score (`create_circle({ min_reputation })`). Low-reputation accounts are refused with `InsufficientReputation`.
- Communities reward reliable members through reward rules and shares.
- Every change is public, emitted as `reputation_updated` events.

New members start small, prove themselves, and earn their way into bigger circles.

### Solo Savings Vaults
Lock funds for disciplined personal saving across five tiers:

> **Yield: planned for mainnet.** On NEAR Testnet, solo vaults enforce deterministic lock durations and principal-only custody (`withdraw` returns deposited USDC 1:1 while building on-chain reputation); yield integrations are planned for mainnet.

| Tier | Name | Lock Period | Minimum | Description |
|:---:|:---|:---:|:---:|:---|
| **0** | **Flex Solo** | 0 days | Any amount | Flexible saving. Deposit anytime; withdraw anytime. |
| **1** | **Weekly Solo** | 7 days | $10 USDC | Short-term commitment for weekly savings habits. |
| **2** | **Monthly Solo** | 30 days | $50 USDC | Monthly pay-yourself-first lock for 30 days. |
| **3** | **6-Month Solo** | 182 days | $100 USDC | Mid-term cushion with a six-month commitment. |
| **4** | **1-Year Solo** | 365 days | $250 USDC | Long-term milestone vault. |

### Community Coordination Layer (Sputnik DAO + Trezu (mainnet only))
```text
┌───────────────────────────────────────────────────────────┐
│ mobile (Expo)                                             │
│  Community tab: create DAO · envelopes · propose · vote   │
│  lib/sputnik.ts (view + tx) · lib/trezu.ts (mainnet only) │
└──────────────┬────────────────────────────┬───────────────┘
               │ add_proposal / act_proposal│ community_* / budget_deposit
               ▼                            ▼
┌──────────────────────────┐     ┌──────────────────────────────┐
│ Sputnik DAO              │     │ Roda Contract                │
│ <name>.sputnikv2.testnet │────▶│  Community Escrow            │
│  Council · Voting ·      │Call │  Budget Envelopes (≤12)      │
│  Transfer · Call ·       │     │  On-Chain Reputation (0–1000)│
│  Bounties [NEAR + USDC]  │     │  Reward Rules & Shares       │
└──────────┬───────────────┘     └──────────────────────────────┘
           │ Trezu (mainnet only) deep-link
           ▼
     trezu.app/<dao>   (Trezu (mainnet only): bulk pay, swaps, confidential, exports)
```
- **Deploy or Link Any Sputnik DAO**: Launch a new DAO via `sputnikv2.testnet` right inside the mobile wizard (or link an existing DAO), then execute `confirm_link` via DAO proposal.
- **Hard-Capped Budget Envelopes**: Allocate pooled escrow into up to 12 labeled envelopes (`Grants`, `Ops`, `Events`, etc.). Disbursements require a DAO `FunctionCall` proposal executing `community_spend`, which atomically rejects any spend exceeding remaining envelope allocation.
- **Trezu (mainnet only) Compatibility**: Every Roda community DAO is a standard Sputnik DAO from the official factory — the same kind Trezu (mainnet only) manages. On mainnet, the community’s DAO opens in Trezu (mainnet only) (`trezu.app/<dao>`) for batch payments, token swaps, and treasury exports; on testnet, the hosted Trezu (mainnet only) app isn’t available.

### Bounties, Programmable Rewards & Collective Ownership
- **Sputnik Native Bounties**: Create, claim, submit (`BountyDone`), and approve DAO bounties directly from mobile.
- **Automated Reward Rules**: DAOs configure envelope-backed rules (`CircleRoundCompleted` or contribution `Streak`) that auto-pay USDC rewards to qualifying members when circle payouts land.
- **Collective Ownership Shares**: Budget deposits mint community shares (`1 micro-USDC = 1 share`) and DAOs can grant merit/reputation-gated shares (`grant_shares`). Upon DAO-approved dissolution (`dissolve_community`), shareholders claim exact pro-rata shares of remaining `pool_unallocated` surplus via `claim_surplus`.

### Non-Custodial Multi-Wallet Engine
- **Email OTP via Magic Labs**: Passwordless login paired with local encrypted keypair persistence and backup recovery code UX.
- **Local Device Wallet**: Ed25519 keypair stored in `Expo SecureStore`.
- **External NEAR Wallets**: Connect **Meteor Wallet**, **MyNearWallet**, or **HERE Wallet** via web auth sessions, with optional full-access scope upgrade in Meteor for signing Sputnik DAO + USDC transactions alongside Roda calls.

### Onchain Username Registry
- Claim lowercase handles (`claim_name`) stored onchain (`[a-z0-9_]`, 3–20 chars, 24h cooldown).

### Mobile Demo Experience
- The mobile app is the primary interactive client for wallets, circles, vaults, communities, proposals, votes, envelopes, reputation, rewards, shares, and transaction history.
- The tab order is **Home → Circles → Community → Save → Wallet**.
- **Android APK Download**: [Download Preview APK](https://expo.dev/artifacts/eas/72debAby9UF2RnLX7Ml-x6YwdDO_YZ6G5bL114sLeLc.apk) — the Android preview build bundles the app screens, contract method logic, public contract/network configuration, fonts, icons, and local artwork.
- Runtime access still requires NEAR RPC, deployed contracts, wallet providers, and network connectivity.
- The demo uses Circle-issued USDC on NEAR testnet. Testnet assets have no financial value, and the Roda faucet is disabled because Roda cannot mint Circle-issued USDC.
- See the [mobile package guide](./mobile/README.md) for environment setup, contract calls, and module structure.

---

## Monorepo Architecture

```
roda-app/
├── program/     # NEAR Protocol smart contracts (Rust / near-sdk 5.x)
├── mobile/      # Cross-platform mobile app (React Native / Expo 58)
└── frontend/    # Marketing landing page & web portal (Next.js 16)
```

| Package | Stack | Purpose |
|:---|:---|:---|
| [`program/`](./program/README.md) | Rust, `near-sdk` 5.x, Borsh, Cargo | Circles, solo vaults, Sputnik community escrow/envelopes, reputation, rewards, shares, usernames, and NEP-141 token settlement. |
| [`mobile/`](./mobile/README.md) | React Native 0.88, Expo 58, TypeScript, NativeWind | Bundled iOS/Android client for the five-tab Roda experience, wallet keys, circles, vaults, DAO creation/voting, envelopes, bounties, reputation, and Trezu (mainnet only) deep links. |
| [`frontend/`](./frontend/README.md) | Next.js 16 (App Router), React 19, Tailwind CSS v4 | Responsive public landing page and protocol showcase. |

---

## Smart Contract Specification

### Deployed Program & Contract Addresses

| Parameter | Testnet Value | Mainnet Target |
|:---|:---|:---|
| **Network** | `testnet` | `mainnet` |
| **RPC Endpoint** | `https://rpc.testnet.fastnear.com` | `https://rpc.mainnet.fastnear.com` |
| **Roda Protocol Program** | [`roda.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) | `roda.near` |
| **Token Asset** | [`3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af`](https://testnet.nearblocks.io/token/3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af) (Circle USDC testnet, 6 decimals) | `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (Native Circle USDC) |
| **Sputnik DAO Factory** | [`sputnikv2.testnet`](https://testnet.nearblocks.io/address/sputnikv2.testnet) | `sputnik-dao.near` |
| **Protocol Admin** | [`dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/dev-92ebb0b3c42c.testnet) | Multi-sig / DAO Treasury |

### Protocol Invariants & Rules

- **Zero Admin Fund Access**: `Config.admin` can update token config, adjust community creation `min_reputation`, trigger upgrades/migrations, and collect 0.3% payout fees — it can never withdraw user deposits, bypass round timing, or execute DAO-gated community spends.
- **DAO Predecessor Enforcement**: `confirm_link`, `allocate`, `community_spend`, `add_envelope`, `set_envelope`, `create_reward_rule`, `toggle_reward_rule`, `grant_shares`, and `dissolve_community` strictly enforce `env::predecessor_account_id() == community.dao_id`.
- **Hard Budget Ceilings**: Every envelope tracks `allocated` and `spent` onchain; disbursement panics with `ExceedsEnvelope` if `amount > envelope.remaining()`.
- **Round Payout Gating**: `claim_payout` requires active circle status, full round payments, elapsed `round_started_ts + frequency_secs`, expected round recipient signer, and unlocked `payout_pending` state.

### NEP-141 Token Transfer Messages

Funding operations use NEAR's `ft_transfer_call` interface with JSON `msg` payloads:

```json
// Circle Contribution:
{ "type": "contribute", "circle": 482910 }

// Solo Vault Deposit:
{ "type": "deposit", "vault_id": 14 }

// Community Budget Deposit (unallocated pool or directly into an active envelope):
{ "type": "budget_deposit", "community": 0, "envelope": null }
```

---

## Directory Structure

```text
roda-app/
├── .env.example
├── README.md
│
├── frontend/                        # Web Landing Page (Next.js 16)
│   ├── app/                         # App Router layout & landing page
│   ├── components/                  # Hero, CirclesShowcase, CommunityCoordination, VaultTiers, Features, Security
│   └── public/                      # Static media assets
│
├── mobile/                          # Mobile Client (Expo 58 / React Native)
│   ├── app/
│   │   ├── (tabs)/                  # Home, Circles, Save (Vaults), Community, Wallet, Profile
│   │   └── community/               # DAO/community wizard, dashboard & proposal composer
│   ├── components/                  # ReputationBadge, CircleCard, CreateCircleWizard, ProfileSidebar, etc.
│   ├── constants/                   # Contract IDs, Sputnik/Trezu (mainnet only) URLs, vault tiers
│   ├── hooks/                       # React Query hooks for Roda & Sputnik DAO
│   ├── lib/                         # near.ts, contract.ts, sputnik.ts, trezu.ts, nearWalletConnect.ts
│   └── providers/                   # WalletContext & session management
│
└── program/                         # Smart Contracts (Rust / near-sdk 5)
    ├── src/
    │   ├── lib.rs                   # Core entrypoint, vaults, circles, names, upgrades/migrate, callbacks
    │   ├── community.rs             # Community DAO escrow, envelopes, reputation, rewards, shares & dissolve
    │   ├── state.rs                 # Contract state, V1->V2 compat, JSON views
    │   ├── ft.rs                    # FungibleTokenReceiver (deposit / contribute / budget_deposit)
    │   ├── events.rs                # NEP-297 event emitters
    │   └── constants.rs             # Fees, limits, reputation weights, reward caps, gas
    ├── token/                       # Optional local test token contract
    └── scripts/                     # deploy-account.js, upgrade.js, smoke-testnet.js, smoke-community.js, test-logic.js
```

---

## Security Model

- **Non-Custodial Keys**: Device keys stay in `Expo SecureStore` / hardware enclave; external NEAR wallets sign with user-controlled full or contract-scoped access keys.
- **DAO Predecessor & Envelope Enforcement**: Community spends and structural changes can only originate from the linked `dao_id` smart contract after governance approval and never exceed allocated envelope budgets.
- **Fail-Safe Async Rollbacks**: Promise callbacks (`on_withdraw`, `on_payout`, `on_spend`, `on_reward_transfer`, `on_claim_surplus`) atomically restore balances, locks, and claim flags on transfer failure.
- **Upgrade & State Migration Safety**: `migrate()` reads raw Borsh state bytes cleanly to support backwards-compatible V1 → V2 upgrades and idempotent V2+ migrations without losing existing vaults, circles, or balances.
- **Auditable NEP-297 Events**: Every vault, circle, community budget, reputation update, reward payout, and share operation emits standardized `EVENT_JSON` logs.

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or later
- **Rust Toolchain**: `stable` with `wasm32-unknown-unknown` target (for smart contracts)
- **Expo Go** or an iOS/Android simulator (for mobile)

### Environment Setup

1. Copy `.env.example` templates where needed (never commit populated `.env` files):
   - `.env.example` -> `.env`
   - `mobile/.env.example` -> `mobile/.env.local`
   - `frontend/.env.example` -> `frontend/.env.local`
   - `program/.env.example` -> `program/.env`

### Running the Mobile App

```bash
cd mobile
npm install
npm run start
```

### Running the Web Frontend

```bash
cd frontend
npm install
npm run dev
```

### Building and Testing Smart Contracts

```bash
cd program
npm install
npm run build                  # Compile roda.wasm and roda_token.wasm
npm test                       # Run Rust unit tests + off-chain reference logic
node scripts/smoke-community.js --alice <alice> --bob <bob>
node scripts/smoke-testnet.js --alice <alice> --bob <bob>
```

---

## Business Model & Roadmap

**Revenue**: Roda charges a flat **0.3% payout fee** (`3 / 1000`) on claimed circle pools during `claim_payout`, routed to the protocol treasury (`Config.admin`) to fund operations and ongoing development without taxing solo vault deposits, circle creation, or DAO governance. Mainnet will add a yield share on locked Solo Vaults and optional organizational treasury tiers.

### Roadmap
- **Phase 1 — Testnet Protocol & Mobile MVP (Live)**: Rust contract deployed at `roda.dev-92ebb0b3c42c.testnet`, Circle USDC settlement, 5-tier principal-only Solo Vaults, Rotating Circles with `min_reputation` gating, Sputnik DAO two-step linking, 12-envelope hard caps, capital-weighted reputation (`0–1000`), automated reward rules, collective shares + dissolution surplus claims, and Expo mobile client.
- **Phase 2 — Mainnet Launch**: Smart contract audit, mainnet deployment on `roda.near` with native mainnet Circle USDC and `sputnik-dao.near`, handover of `Config.admin` via `set_admin` to a Multi-sig / DAO Treasury, live Trezu (mainnet only) treasury deep-links (`trezu.app/<dao>`), yield for Solo Vaults, and a pilot with real savings groups.
- **Phase 3 — Ecosystem Expansion**: Cross-community reputation portability, automated late-payment recovery mechanics, and localized fiat on/off-ramp integrations for diaspora savings groups.

---

## Hackathon Scope

I started building Roda in this repository at [`6e2b987`](https://github.com/bashir1738/roda-app/commit/6e2b987) (`2026-11-03`), and every commit in [`main`](https://github.com/bashir1738/roda-app/commits/main) from `2026-11-03` onward is NEAR Protocol work built after **19 October 2026**:

- **NEAR Smart Contracts (`program/`, Rust / `near-sdk` 5.x)**: Full NEAR smart contract implementation covering rotating circles, solo vaults, NEP-141 Circle USDC (`ft_transfer_call`) settlement with atomic async rollback callbacks, on-chain usernames, and Borsh state upgrades (`migrate()`).
- **NEAR-Native Community & Governance Layer (`program/src/community.rs`, `2026-11-11`)**: Standard `sputnikv2` DAO deployment and two-step linking (`confirm_link`), hard-capped budget envelopes (`<= 12`, `ExceedsEnvelope`), capital-weighted on-chain reputation (`0–1000`, `min_reputation` gating, `reputation_updated` NEP-297 events), automated payout reward rules, collective ownership shares (`grant_shares`), and pro-rata dissolution claims (`dissolve_community` / `claim_surplus`).
- **Mobile Wallet & Client Integration (`mobile/`, `2026-11-05`–`2026-11-12`)**: Non-custodial NEAR Ed25519 key storage in `Expo SecureStore`, Magic OTP encrypted backup, Meteor / MyNearWallet / HERE Wallet integration, Circle USDC flows, and mobile Sputnik DAO proposal/voting/bounty/envelope/reputation UX (distributed via the testnet Android preview APK).
- **Testnet Deployment & Showcase (`frontend/`, `program/scripts/`)**: Live contract deployment on `roda.dev-92ebb0b3c42c.testnet`, Circle USDC configuration, end-to-end smoke verification (`smoke-testnet.js`, `smoke-community.js`), and the Next.js landing page.

---

## License

This project is open-source software licensed under the [MIT License](./LICENSE).
