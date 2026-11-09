# Roda NEAR contracts

The `program/` package contains the Roda protocol on **NEAR Protocol**:

| Contract | Path | Purpose |
| --- | --- | --- |
| `roda` | `program/` (crate root) | Circles, vaults, usernames, activity, fees, self-upgrade |
| `roda-token` | `program/token/` | Test NEP-141 FT (`rUSDC`) with protocol-gated mint & self-upgrade |

On mainnet, `Config.token_id` points at native Circle USDC (`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`). On testnet it points at the Roda test token with a faucet.

## Deployed Contract Addresses (NEAR Testnet)

| Role | Account ID | Explorer Link |
| --- | --- | --- |
| **Roda Protocol Contract** | `roda.dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) |
| **NEP-141 USDC Token** | `usdc.dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/usdc.dev-92ebb0b3c42c.testnet) |
| **Protocol Admin** | `dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/dev-92ebb0b3c42c.testnet) |

## Protocol invariants

- Contributions use `ft_transfer_call` into the Roda contract with `msg = {"type":"contribute","circle":N}`; deposits use `{"type":"deposit","vault_id":N}`.
- A contribution must equal `contribution_amount` exactly and only from a current member who has not paid this round.
- A payout requires every member paid for the current round and `now >= round_started_ts + frequency_secs`.
- The recipient must be `members[current_round % members.len()]`.
- Payout locks the circle (`payout_pending`), transfers the recipient amount first, then the 0.3% fee to `Config.admin`. Fee failures accumulate in `fees_owed` and can be retried with `collect_fees`.
- Vault withdrawals debit balance immediately and restore on failed `ft_transfer`.
- Username claims are lowercase `[a-z0-9_]`, length 3–20, 24h cooldown.

## Admin

`Config.admin` is set once in `new(admin, token_id, faucet_enabled)`. The admin can later call `set_token(token_id, faucet_enabled)` to switch the settlement asset (e.g. test FT → native USDC) and toggle the faucet. The admin receives protocol fees. The admin cannot move user funds, alter membership, or skip round timing.

## Development

Requirements: Rust (see `rust-toolchain.toml`), `wasm32-unknown-unknown` target. **Deploy and testnet smoke runs are intentionally not part of the default workflow** — run them only when you intend to touch a live network.

```bash
# Unit tests (host target — no wasm deploy)
cargo test -p roda
cargo test -p roda-token

# Pure JS logic tests (no network)
node scripts/test-logic.js

# Build wasm
cargo build --target wasm32-unknown-unknown --release -p roda
cargo build --target wasm32-unknown-unknown --release -p roda-token
```

Or via npm scripts:

```bash
npm test          # cargo tests + logic tests (see package.json)
npm run build     # both wasm artifacts
```

## Deployment & Upgrades

```bash
cp .env.example .env   # fill in accounts and NEAR_PRIVATE_KEY

npm install
npm run build
node scripts/deploy-account.js   # automated setup: subaccounts + deploy + init + storage_deposit
node scripts/set-token.js        # optional: switch token / faucet flag
node scripts/smoke-testnet.js --alice alice.testnet --bob bob.testnet

# Self-upgrade contracts in-place (with 300 TGas + state migration):
npm run upgrade -- --contract roda
npm run upgrade -- --contract token
```

State written by setup lives in `scripts/testnet-state.json` (gitignored after first real run if you prefer; a template is committed).

Never commit private keys, `.env`, or credential files.

## Structure

```
program/
  src/
    lib.rs        # RodaContract: vaults, circles, names, faucet, callbacks, views
    state.rs      # Config, Vault, Circle, Activity, JSON views
    events.rs     # NEP-297 EVENT_JSON helpers
    ft.rs         # FungibleTokenReceiver (deposit / contribute)
    constants.rs  # rules, fee, faucet, gas
  token/
    src/lib.rs    # NEP-141 + NEP-145 + NEP-148 + gated mint
  scripts/        # setup / set-token / smoke / logic tests
```

## Error codes

Stable strings used by the mobile `friendlyError` mapper: `RoundNotReady`, `NotYourPayout`, `NotAllPaid`, `PendingTransfer`, `CircleFull`, `CircleNotJoinable`, `CircleCodeTaken`, `InvalidCircleCode`, `InvalidCircleName`, `InvalidContribution`, `InvalidFrequency`, `VaultNotMatured`, `InsufficientBalance`, `BelowMinimumDeposit`, `FaucetCooldown`, `FaucetUnavailable`, `CooldownActive`, `NameTaken`, `NameTooShort`, `NameTooLong`, `InvalidNameChars`, `Unauthorized`, `AlreadyPaid`, `NotAMember`, `MathOverflow`, and related `*NotFound` / `*NotActive` codes.

## Events

NEP-297 logs under standard `roda` v`0.1.0`:

`VaultCreated`, `VaultDeposit`, `VaultWithdraw`, `VaultClosed`, `CircleCreated`, `MemberJoined`, `ContributionMade`, `PayoutReleased`, `CircleClosed`, `NameClaimed`, `NameReleased`, `FaucetClaimed`.

The test token also emits `nep141`/`ft_mint` on faucet mints.

## Method map (mobile / frontend)

| Action | Call |
| --- | --- |
| Create vault | `create_vault({ tier })` |
| Deposit | `ft_transfer_call` → Roda `msg={"type":"deposit","vault_id":N}` |
| Withdraw | `withdraw({ vault_id, amount })` |
| Create circle | `create_circle({ circle_code, name, max_members, contribution_amount, frequency_secs })` |
| Join | `join_circle({ circle_code })` |
| Contribute | `ft_transfer_call` → Roda `msg={"type":"contribute","circle":N}` |
| Claim payout | `claim_payout({ circle_code })` |
| Close circle | `close_circle({ circle_code })` |
| Username | `claim_name({ name })` / `release_name()` |
| Faucet | `faucet()` |
| Views | `get_config`, `get_vault`, `get_user_vaults`, `get_circle`, `get_circles`, `get_user_circle_ids`, `get_profile`, `get_name_owner`, `get_activity`, `get_faucet_info` |
