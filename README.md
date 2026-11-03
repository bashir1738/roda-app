# Roda

**Rotating Savings, Reimagined Onchain**

Roda is a mobile savings platform that digitalizes the traditional African rotating savings system — ajo, esusu, adashe — and combines it with individual savings vaults. No organizer. No trust required. The rules are in code.

## The Problem

Rotating savings groups have existed across Africa for generations. They break for the same reasons every time — the organizer disappears with the pot, a member stops paying with no consequence, there is no record of who paid what, and the money earns nothing while it waits. Roda fixes all of this.

## How It Works

### Circles

Create or join a rotating savings group. Every member contributes a fixed USDC amount on a set schedule. When all contributions land, the smart contract automatically releases the full pot to the next member in the queue. No admin, no manual release, no single person holding the funds.

### Vaults

Save solo between payout cycles. Deposit USDC into one of three vault tiers:

| Tier | Schedule | Minimum | Description |
|---|---|---|---|
| **Flex Solo** | No schedule | Any amount | Save at your own pace. Add funds whenever you have extra cash. Withdraw anytime. |
| **Weekly Solo** | Weekly | $10/week | Build consistency. Lock in a weekly amount to slowly build your personal pot. |
| **Monthly Solo** | Monthly | $50/month | Pay yourself first. Set aside a fixed chunk of your paycheck every month. |

### History

A full onchain record of every contribution, payout, deposit, and withdrawal — tied to your wallet address and verifiable by anyone.

## Target Audience

Urban professionals in Nigeria and across West Africa aged 22–40 who already participate in ajo but want a version that is trustless, transparent, and puts idle savings to work.

## Architecture

| Package | Stack | Description |
|---|---|---|
| [`program/`](./program/README.md) | Rust / near-sdk 5.x | NEAR contracts — vaults, circles, token custody |
| [`mobile/`](./mobile/README.md) | React Native / Expo | Mobile wallet and savings interface |
| [`frontend/`](./frontend/README.md) | Next.js | Web dashboard and marketing site |

The mobile app reads the contract config to resolve the configured NEP-141 token. Circle and vault state is enforced by the NEAR contract; the client only submits calls and presents state. Circle payouts are distributed by the contract, including the configured 0.3% protocol fee to the admin account.

Circle payouts are time-gated on-chain: all members must pay, the round recipient must sign, and the configured frequency must have elapsed since the round start. The app's countdown is presentation only and is never trusted for authorization.

## Smart Contract

**Contract account:** `roda.testnet` (placeholder; deployment has not been performed)  
**Current development network:** NEAR testnet  

The onchain program implements:
- **AjoCircle** — Trustless rotating savings circles. Members contribute USDC each round; the pot is released to the current round's recipient.
- **RodaVault** — Individual savings vaults with tiered lock periods.
- **UsernameRegistry** — Onchain display names for Roda wallets. Case-insensitive, 24h cooldown between changes.

The config admin (configured through `DEPLOYER_PUBKEY`) can update the six-decimal USDC mint and receives the 0.3% payout fee, but cannot bypass circle membership, recipient, contribution, or timing checks. Keep the configured mint operationally stable after launch because existing accounts store their mint association.

## Quick Start

```bash
# Set up environment variables (copy .env.example into .env for each package as needed)
cp .env.example .env

# Start the mobile app
cd mobile && npm install && npm run start

# Start the frontend
cd ../frontend && npm install && npm run dev
```

### Build (Program)

```bash
cd program
cargo near build
```

No deployment, testnet smoke run, or test execution has been performed for this migration.
