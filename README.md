# Roda

<p align="center">
  <strong>Rotating Savings &amp; Community Treasuries, Onchain</strong><br />
  <em>Digitalizing community savings, shared DAO budgets, and verifiable reputation on NEAR Protocol.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NEAR-Testnet-00C08B?style=flat-square&logo=near" alt="NEAR Testnet" />
  <img src="https://img.shields.io/badge/Contracts-Rust_%2F_near--sdk_5.x-DEA584?style=flat-square&logo=rust" alt="Rust Contracts" />
  <img src="https://img.shields.io/badge/Governance-Sputnik_DAO_%2B_Trezu-111111?style=flat-square" alt="Sputnik DAO and Trezu" />
  <img src="https://img.shields.io/badge/Mobile-Expo_%2F_React_Native-4630EB?style=flat-square&logo=expo" alt="Mobile Expo" />
  <img src="https://img.shields.io/badge/Frontend-Next.js_16-black?style=flat-square&logo=next.js" alt="Next.js Frontend" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [The Problem & The Solution](#the-problem--the-solution)
- [Core Features](#core-features)
  - [Rotating Savings Circles (Ajo / Esusu)](#rotating-savings-circles-ajo--esusu)
  - [Solo Savings Vaults](#solo-savings-vaults)
  - [Community Coordination Layer (Sputnik DAO + Trezu)](#community-coordination-layer-sputnik-dao--trezu)
  - [On-Chain Reputation & Trust Gating](#on-chain-reputation--trust-gating)
  - [Bounties, Programmable Rewards & Collective Ownership](#bounties-programmable-rewards--collective-ownership)
  - [Non-Custodial Multi-Wallet Engine](#non-custodial-multi-wallet-engine)
  - [Onchain Username Registry & Testnet Faucet](#onchain-username-registry--testnet-faucet)
- [Monorepo Architecture](#monorepo-architecture)
- [Smart Contract Specification](#smart-contract-specification)
  - [Deployed Program & Contract Addresses](#deployed-program--contract-addresses)
  - [Protocol Invariants & Rules](#protocol-invariants--rules)
  - [NEP-141 Token Transfer Messages](#nep-141-token-transfer-messages)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Running the Mobile App](#running-the-mobile-app)
  - [Running the Web Frontend](#running-the-web-frontend)
  - [Building and Testing Smart Contracts](#building-and-testing-smart-contracts)
- [Directory Structure](#directory-structure)
- [Security Model](#security-model)
- [License](#license)

---

## Overview

**Roda** is a decentralized savings and community treasury platform built on **NEAR Protocol**. It combines rotating savings and credit associations (ROSCAs — known across Africa and the diaspora as *ajo*, *esusu*, or *adashe*), fixed-term personal USDC vaults, and a **Community Coordination Layer** powered by **Sputnik DAO** and **Trezu**.

By replacing human middlemen with deterministic smart contracts, Roda eliminates organizer default and opaque bookkeeping while letting growing communities scale into full multi-sig DAOs with hard-capped budget envelopes, capital-weighted on-chain reputation, programmable rewards, and collective ownership shares.

> **Live NEAR Testnet Program**: [`roda.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) · **Test USDC**: [`usdc.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/usdc.dev-92ebb0b3c42c.testnet) · **Sputnik DAO Factory**: [`sputnikv2.testnet`](https://testnet.nearblocks.io/address/sputnikv2.testnet)

---

## The Problem & The Solution

Traditional rotating savings clubs and community pots suffer from structural vulnerabilities:
1. **Organizer Risk**: Group organizers can disappear with pooled cash or manipulate payout orders.
2. **Default / Drop-out**: Members receive early payouts and stop contributing to subsequent rounds without consequence.
3. **Unchecked Treasury Spends**: Even with a multi-sig, treasuries lack hard program/project spending caps and automated circle incentives.
4. **No Portable Trust**: Savers who consistently honor commitments earn zero portable proof of creditworthiness.

**How Roda Fixes This**:
- **Trustless Circle & Vault Custody**: Roda smart contracts custody circle pools and solo vaults deterministically; no admin can withdraw or redirect user funds.
- **Sputnik DAO + Trezu Split Custody**: Community operations stay inside standard Sputnik DAOs (managed natively in mobile and deep-linked to `trezu.app/<dao>`), while earmarked budgets sit in Roda escrow envelopes enforced with hard spending limits.
- **Capital-Weighted Reputation**: On-chain activity scores real USDC reliability and tenure (0–1000) to gate high-trust circles without centralized credit bureaus.

---

## Core Features

### Rotating Savings Circles (Ajo / Esusu)
- **Create a Circle**: Configure member size (2–12), fixed USDC contribution, cadence (10 minutes, weekly, bi-weekly, or monthly), optional minimum on-chain reputation gate, and a 6-digit invite code.
- **Join via Code**: Members inspect reputation requirements and join directly from mobile.
- **Round Contributions & Payouts**: Contributions settle via `ft_transfer_call`. Once every member pays and the round interval elapses, the designated recipient claims the pool (with a flat 0.3% protocol fee and automatic reward rule evaluation).

### Solo Savings Vaults
Lock funds for disciplined personal saving across five tiers:

| Tier | Name | Lock Period | Minimum | Description |
|:---:|:---|:---:|:---:|:---|
| **0** | **Flex Solo** | 0 days | Any amount | Flexible saving. Deposit anytime; withdraw anytime. |
| **1** | **Weekly Solo** | 7 days | $10 USDC | Short-term commitment for weekly savings habits. |
| **2** | **Monthly Solo** | 30 days | $50 USDC | Monthly pay-yourself-first lock for 30 days. |
| **3** | **6-Month Solo** | 182 days | $100 USDC | Mid-term cushion with a six-month commitment. |
| **4** | **1-Year Solo** | 365 days | $250 USDC | Long-term milestone vault. |

### Community Coordination Layer (Sputnik DAO + Trezu)
```text
┌───────────────────────────────────────────────────────────┐
│ mobile (Expo)                                             │
│  Community tab: create DAO · envelopes · propose · vote   │
│  lib/sputnik.ts (view + tx) · lib/trezu.ts (deep-links)   │
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
           │ deep-link
           ▼
     trezu.app/<dao>   (bulk pay, swaps, confidential, exports)
```
- **Deploy or Link Any Sputnik DAO**: Launch a new DAO via `sputnikv2.testnet` right inside the mobile wizard (or link an existing DAO), then execute `confirm_link` via DAO proposal.
- **Hard-Capped Budget Envelopes**: Allocate pooled escrow into up to 12 labeled envelopes (`Grants`, `Ops`, `Events`, etc.). Disbursements require a DAO `FunctionCall` proposal executing `community_spend`, which atomically rejects any spend exceeding remaining envelope allocation.
- **Trezu Deep-Linking**: Jump directly to `trezu.app/<dao>` from any community dashboard for batch payments, token swaps, and treasury exports.

### On-Chain Reputation & Trust Gating
- **0–1000 Score**: Lazily updated inside Roda transactions from on-time circle contributions, completed circles, matured vault withdrawals, community escrow deposits, and account tenure (minus late penalties).
- **Sybil Resistance**: Score derives strictly from verifiable USDC capital at risk and calendar time — spawning empty accounts yields `0` reputation.
- **Threshold Gates**: Enforce minimum reputation scores on high-trust circles (`create_circle` / `join_circle`) and optionally on community creation or DAO share grants.

### Bounties, Programmable Rewards & Collective Ownership
- **Sputnik Native Bounties**: Create, claim, submit (`BountyDone`), and approve DAO bounties directly from mobile.
- **Automated Reward Rules**: DAOs configure envelope-backed rules (`CircleRoundCompleted` or contribution `Streak`) that auto-pay USDC rewards to qualifying members when circle payouts land.
- **Collective Ownership Shares**: Budget deposits mint community shares (`1 micro-USDC = 1 share`) and DAOs can grant merit/reputation-gated shares (`grant_shares`). Upon DAO-approved dissolution (`dissolve_community`), shareholders claim exact pro-rata shares of remaining `pool_unallocated` surplus via `claim_surplus`.

### Non-Custodial Multi-Wallet Engine
- **Email OTP via Magic Labs**: Passwordless login paired with local encrypted keypair persistence and backup recovery code UX.
- **Local Device Wallet**: Ed25519 keypair stored in `Expo SecureStore`.
- **External NEAR Wallets**: Connect **Meteor Wallet**, **MyNearWallet**, or **HERE Wallet** via web auth sessions, with optional full-access scope upgrade in Meteor for signing Sputnik DAO + USDC transactions alongside Roda calls.

### Onchain Username Registry & Testnet Faucet
- Claim lowercase handles (`claim_name`) stored onchain (`[a-z0-9_]`, 3–20 chars, 24h cooldown).
- Claim 1,000 test USDC (`rUSDC`) every 24h on testnet via `faucet()`.

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
| [`program/`](./program/README.md) | Rust, `near-sdk` 5.x, Borsh, Cargo | Circles, solo vaults, Sputnik community escrow/envelopes, reputation, rewards, shares, usernames, and test token custody. |
| [`mobile/`](./mobile/README.md) | React Native 0.88, Expo 58, TypeScript, NativeWind | iOS/Android client handling wallet keys, circles, vaults, DAO creation/voting, envelopes, bounties, reputation, and Trezu deep links. |
| [`frontend/`](./frontend/README.md) | Next.js 16 (App Router), React 19, Tailwind CSS v4 | Responsive public landing page and protocol showcase. |

---

## Smart Contract Specification

### Deployed Program & Contract Addresses

| Parameter | Testnet Value | Mainnet Target |
|:---|:---|:---|
| **Network** | `testnet` | `mainnet` |
| **RPC Endpoint** | `https://rpc.testnet.fastnear.com` | `https://rpc.mainnet.fastnear.com` |
| **Roda Protocol Program** | [`roda.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) | `roda.near` |
| **Token Asset** | [`usdc.dev-92ebb0b3c42c.testnet`](https://testnet.nearblocks.io/address/usdc.dev-92ebb0b3c42c.testnet) (`rUSDC`, 6 decimals) | `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (Native Circle USDC) |
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
node scripts/test-logic.js     # Verify off-chain reference math
node scripts/smoke-community.js --alice <alice> --bob <bob>
node scripts/smoke-testnet.js --alice <alice> --bob <bob>
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
│   ├── constants/                   # Contract IDs, Sputnik/Trezu URLs, vault tiers
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
    ├── token/                       # Test NEP-141 token contract (rUSDC)
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

## License

This project is open-source software licensed under the [MIT License](./LICENSE).
