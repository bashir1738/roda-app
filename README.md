# Roda

<p align="center">
  <strong>Rotating Savings, Reimagined Onchain</strong><br />
  <em>Digitalizing community savings (Ajo / Esusu / Adashe) with smart contracts on NEAR Protocol.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NEAR-Testnet-00C08B?style=flat-square&logo=near" alt="NEAR Testnet" />
  <img src="https://img.shields.io/badge/Contracts-Rust_%2F_near--sdk_5.x-DEA584?style=flat-square&logo=rust" alt="Rust Contracts" />
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
  - [Non-Custodial Multi-Wallet Engine](#non-custodial-multi-wallet-engine)
  - [Onchain Username Registry](#onchain-username-registry)
  - [Testnet Faucet](#testnet-faucet)
- [Monorepo Architecture](#monorepo-architecture)
- [Smart Contract Specification](#smart-contract-specification)
  - [Deployment Information](#deployment-information)
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

**Roda** is a decentralized savings platform that digitalizes rotating savings and credit associations (ROSCAs) — known across Africa and the diaspora as *ajo*, *esusu*, or *adashe* — and unites them with disciplined personal savings vaults on the **NEAR Protocol**.

By replacing human middlemen with deterministic smart contracts, Roda removes trust requirements: funds are held in non-custodial contracts, contributions are tracked transparently, payouts are enforced mathematically, and money is settled in USD Coin (USDC).

---

## The Problem & The Solution

Traditional rotating savings clubs suffer from chronic structural vulnerabilities:
1. **Organizer Risk**: Group organizers can disappear with pooled cash or manipulate payout orders.
2. **Default / Drop-out**: Members receive early payouts and stop contributing to subsequent rounds without consequence.
3. **No Verifiable Audit Trail**: Paper or spreadsheet bookkeeping leads to disputes over who paid when.
4. **Inflation & Idle Cash**: Savings held in physical cash or unyielding local bank accounts lose purchasing power.

**How Roda Fixes This**:
- **Trustless Custody**: Smart contracts custody all funds. No organizer or platform admin can withdraw or redirect pool funds.
- **Transparent Onchain Queue**: Payout order and contribution status are recorded publicly on the blockchain.
- **USDC Settlement**: Savings are denominated in stable digital dollars to hedge local currency devaluation.
- **Solo Vaults**: Flexible and fixed-term savings tiers allow users to grow funds solo between circle rounds.

---

## Core Features

### Rotating Savings Circles (Ajo / Esusu)
- **Create a Circle**: Group organizers create circles with custom member sizes (2–12), fixed USDC contribution amounts, and frequencies (10 minutes, weekly, bi-weekly, or monthly). A unique 6-digit code is assigned for easy sharing.
- **Join via Code**: Prospective members look up circles using their 6-digit code and join directly from mobile.
- **Round Contributions**: Members fund each round using NEP-141 token transfers (`ft_transfer_call`). Live checkmarks indicate which members have contributed.
- **Automated Payouts**: Once all round contributions land and the round frequency elapses, the designated round recipient claims the pot. A flat 0.3% protocol fee is routed to the protocol.

### Solo Savings Vaults
Lock funds for disciplined solo saving between circle cycles. Five distinct tiers accommodate different horizons:

| Tier | Name | Lock Period | Minimum | Description |
|:---:|:---|:---:|:---:|:---|
| **0** | **Flex Solo** | 0 days | Any amount | Flexible saving. Deposit whenever you have surplus cash; withdraw anytime. |
| **1** | **Weekly Solo** | 7 days | $10 USDC | Short-term commitment to build a weekly savings habit. |
| **2** | **Monthly Solo** | 30 days | $50 USDC | Monthly pay-yourself-first allocation locked for 30 days. |
| **3** | **6-Month Solo** | 182 days | $100 USDC | Mid-term cushion building with a six-month commitment. |
| **4** | **1-Year Solo** | 365 days | $250 USDC | Long-term milestone vault for serious financial goals. |

### Non-Custodial Multi-Wallet Engine
Users interact through frictionless authentication without sacrificing crypto sovereignty:
- **Email OTP via Magic Labs**: Passwordless one-time passcodes derive a secure, deterministic NEAR keypair locally. A one-time backup recovery code ensures account continuity.
- **Local Device Wallet**: Instant offline keypair generation stored in encrypted hardware storage (`Expo SecureStore`).
- **External Web3 Wallets**: One-click connection to leading NEAR wallets including **Meteor Wallet**, **MyNearWallet**, and **HERE Wallet** via secure web authentication sessions.

### Onchain Username Registry
Users can register unique, human-readable display handles (`claim_name`) stored onchain in the contract, replacing unwieldy 64-character hex addresses in circles and queues.

### Testnet Faucet
A built-in test faucet allows new testnet users to claim 1,000 test USDC (`rUSDC`) directly in the app to test circle creation, contributions, and solo vaults.

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
| [`program/`](./program/README.md) | Rust, `near-sdk` 5.x, Borsh, Cargo | Onchain protocol logic: circles, vaults, username registry, activity logs, and token custody. |
| [`mobile/`](./mobile/README.md) | React Native 0.88, Expo 58, TypeScript, NativeWind | Primary client application for iOS and Android. Handles wallet creation, transaction signing, and savings management. |
| [`frontend/`](./frontend/README.md) | Next.js 16 (App Router), React 19, Tailwind CSS v4 | Responsive public marketing site and product walkthrough. |

---

## Smart Contract Specification

### Deployment Information

| Parameter | Testnet Value | Mainnet Target |
|:---|:---|:---|
| **Network** | `testnet` | `mainnet` |
| **RPC Endpoint** | `https://rpc.testnet.fastnear.com` | `https://rpc.mainnet.fastnear.com` |
| **Roda Contract** | `roda.testnet` | `roda.near` |
| **Token Asset** | `roda-usdc.testnet` (Test NEP-141) | `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` (Native Circle USDC) |

### Protocol Invariants & Rules

- **Zero Admin Fund Access**: The protocol admin (`Config.admin`) can configure token addresses and collect protocol fees, but can never withdraw user deposits, alter circle membership, or bypass round timing gates.
- **Round Payout Gating**: A circle payout can only be claimed when:
  1. `circle.status == CircleStatus::Active`
  2. Every circle member has contributed for the current round (`circle.paid.len() == circle.members.len()`).
  3. The scheduled frequency has elapsed (`now >= round_started_ts + frequency_secs`).
  4. The transaction signer is the current round recipient: `members[current_round % members.len()]`.
  5. The circle is not currently locked in an in-flight transfer (`!circle.payout_pending`).
- **Fee Structure**: A flat 0.3% protocol fee is deducted upon payout execution and sent to the protocol treasury.

### NEP-141 Token Transfer Messages

Funding operations use NEAR's standard `ft_transfer_call` interface with attached JSON payload strings:

```json
// Circle Contribution:
{ "type": "contribute", "circle": 482910 }

// Solo Vault Deposit:
{ "type": "deposit", "vault_id": 14 }
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v18.0.0` or later
- **Package Managers**: `npm` (or `pnpm` / `yarn`)
- **Rust Toolchain**: `stable` with `wasm32-unknown-unknown` target (only required to compile contracts)
- **Expo Go** or an iOS/Android simulator for mobile development

### Environment Setup

1. Copy the shared root configuration template:
   ```bash
   cp .env.example .env
   ```

2. Review package-specific `.env.example` files:
   - `mobile/.env.example` -> `mobile/.env.local`
   - `frontend/.env.example` -> `frontend/.env.local`
   - `program/.env.example` -> `program/.env`

---

### Running the Mobile App

```bash
cd mobile

# 1. Install dependencies (runs postinstall patches automatically)
npm install

# 2. Start Expo development server
npm run start

# Run on specific platform
npm run android   # Open on Android Emulator / device
npm run ios       # Open on iOS Simulator
npm run web       # Preview in browser
```

---

### Running the Web Frontend

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Run Next.js local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page.

---

### Building and Testing Smart Contracts

```bash
cd program

# Run contract unit tests & JS logic verification
npm test
# (Equivalent to: cargo test -p roda && cargo test -p roda-token && node scripts/test-logic.js)

# Compile contracts to WebAssembly (release target)
npm run build
```

Compiled WASM artifacts will be generated at:
- `program/target/wasm32-unknown-unknown/release/roda.wasm`
- `program/target/wasm32-unknown-unknown/release/roda_token.wasm`

---

## Directory Structure

```text
roda-app/
├── .env.example                     # Shared testnet environment variables
├── README.md                        # Master project documentation
│
├── frontend/                        # Web Landing Page (Next.js 16)
│   ├── app/                         # App Router pages and layout
│   ├── components/                  # UI components (Hero, Features, Calculator)
│   └── public/                      # Static assets and media
│
├── mobile/                          # Mobile Client (Expo 58 / React Native)
│   ├── app/                         # Expo Router screens ((tabs), modals)
│   │   ├── (tabs)/
│   │   │   ├── index.tsx            # Home dashboard & quick actions
│   │   │   ├── circles.tsx          # Circles browser & management
│   │   │   ├── save.tsx             # Solo vaults & tier carousel
│   │   │   └── wallet.tsx           # Multi-asset wallet, faucet & activity
│   │   └── _layout.tsx              # Root app wrapper & providers
│   ├── components/                  # Reusable UI widgets & sheets
│   ├── constants/                   # Contract IDs, tiers, and network settings
│   ├── hooks/                       # React Query hooks for contracts & state
│   ├── lib/                         # NEAR RPC, key management & wallet connect
│   └── providers/                   # WalletContext & profile state
│
└── program/                         # Smart Contracts (Rust / near-sdk)
    ├── src/
    │   ├── lib.rs                   # Main contract entrypoint & external methods
    │   ├── state.rs                 # Contract state structs and JSON views
    │   ├── ft.rs                    # NEP-141 FungibleTokenReceiver handler
    │   ├── events.rs                # NEP-297 event emitters
    │   └── constants.rs             # Protocol fees, limits, and gas constants
    ├── token/                       # Test NEP-141 token contract (rUSDC)
    └── scripts/                     # Testnet deployment, smoke & logic test scripts
```

---

## Security Model

- **Non-Custodial**: Neither Roda nor any server has custody of user assets. Keys generated on-device never leave the device hardware security enclave (`Expo SecureStore` / iOS Keychain / Android Keystore).
- **Near-Native Access Keys**: External wallets authenticate through scoped function call access keys or full access keys managed strictly by the user's wallet provider.
- **Fail-Safe Async Rollbacks**: All cross-contract transfers (`ft_transfer_call`, `withdraw`, `claim_payout`) utilize NEAR promise callbacks. If a token transfer fails, balances and locks are atomically restored onchain.
- **Auditable History**: Contract state emits standardized NEP-297 events (`EVENT_JSON`) for all state mutations, ensuring transparent indexability.

---

## License

This project is open-source software licensed under the [MIT License](./LICENSE).
