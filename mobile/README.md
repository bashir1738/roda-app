# Roda mobile

The `mobile/` package is an Expo React Native client for the Roda NEAR
contracts. It reads contract views over NEAR JSON-RPC and signs account calls
with one of the supported wallet flows:

1. **Create an in-app wallet** — a NEAR keypair is generated and stored in
   Expo SecureStore.
2. **Continue with email** — Magic verifies the email, then the app uses the
   same local key model (Pattern A). A one-time backup code flow is the
   recovery UX for this key and must be completed before the email session is
   considered finished.
3. **Connect Meteor** — Meteor supplies the account and transaction signer
   through its mobile bridge.

NEAR Connect is intentionally a documented follow-up. Email-key restore via a
backend is also future work; no backend exists in this repository.

## Development

```bash
npm install
npm run start
```

No build, type-check, test, deploy, or testnet smoke command was run during
this migration.

## Environment

Copy `.env.example` to `.env.local`:

```bash
EXPO_PUBLIC_NEAR_NETWORK=testnet
EXPO_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.near.org
EXPO_PUBLIC_CONTRACT_ID=roda.testnet
EXPO_PUBLIC_FT_ID=roda-usdc.testnet
EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY=
```

The contract and FT IDs are placeholders until a testnet deployment is
performed. `Config.token_id` can later be switched by the contract admin to
native Circle USDC for mainnet.

## Contract calls

- Vaults: `create_vault`, `withdraw`, and `close_vault`
- Deposits: `ft_transfer_call` with
  `{"type":"deposit","vault_id":N}`
- Circles: `create_circle`, `join_circle`, `claim_payout`, and `close_circle`
- Contributions: `ft_transfer_call` with
  `{"type":"contribute","circle":N}`
- Names: `claim_name` and `release_name`
- Test faucet: `faucet`
- History: `get_activity` (contract-stored, capped per user)

The client uses `near-api-js` for JSON-RPC and account calls. Contract
invariants, fee calculation, cooldowns, round gating, and transfer callbacks
remain enforced on-chain.

## Structure

- `lib/near.ts` — testnet connection and key store
- `lib/nearKey.ts` — SecureStore keypair persistence
- `lib/contract.ts` — contract views, calls, and NEP-141 transfers
- `providers/WalletContext.tsx` — device, Magic, and Meteor session flows
- `hooks/` — screen-facing query and action hooks
- `constants/roda.ts` — network, contract, token, and display constants
