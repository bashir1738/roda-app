# Roda NEAR contracts

The `program/` package contains the Roda protocol on **NEAR Protocol**:

| Contract | Path | Purpose |
| --- | --- | --- |
| `roda` | `program/` (crate root) | Circles, solo vaults, community DAO coordination & budget envelopes, reputation, programmable rewards, collective shares, usernames, activity, fees, self-upgrade |
| `roda-token` | `program/token/` | Test NEP-141 FT (`rUSDC`) with protocol-gated mint & self-upgrade |

On mainnet, `Config.token_id` points at native Circle USDC (`17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`). On testnet it points at the Roda test token with a faucet.

## Deployed Program & Contract Addresses (NEAR Testnet)

| Role | Account ID | Explorer Link |
| --- | --- | --- |
| **Roda Protocol Program** | `roda.dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/roda.dev-92ebb0b3c42c.testnet) |
| **NEP-141 USDC Token** | `usdc.dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/usdc.dev-92ebb0b3c42c.testnet) |
| **Protocol Admin** | `dev-92ebb0b3c42c.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/dev-92ebb0b3c42c.testnet) |
| **Sputnik DAO Factory** | `sputnikv2.testnet` | [NearBlocks](https://testnet.nearblocks.io/address/sputnikv2.testnet) |

## Protocol invariants

### Savings Circles & Vaults
- Contributions use `ft_transfer_call` into the Roda contract with `msg = {"type":"contribute","circle":N}`; deposits use `{"type":"deposit","vault_id":N}`.
- A contribution must equal `contribution_amount` exactly and only from a current member who has not paid this round.
- Joining a circle enforces `circle.min_reputation` against the caller's live on-chain reputation score when `min_reputation > 0`.
- A payout requires every member paid for the current round and `now >= round_started_ts + frequency_secs`.
- The recipient must be `members[current_round % members.len()]`.
- Payout locks the circle (`payout_pending`), transfers the recipient amount first, then routes the 0.3% fee to `Config.admin` and eligible Phase 3 auto-rewards (`MAX_AUTO_REWARDS_PER_PAYOUT = 3`). Fee failures accumulate in `fees_owed` and can be retried with `collect_fees`.
- Vault withdrawals debit balance immediately and restore on failed `ft_transfer`.
- Username claims are lowercase `[a-z0-9_]`, length 3–20, 24h cooldown.

### Community Coordination Layer (Sputnik DAO + Trezu)
- **Split Custody**: Each community anchors to a Sputnik DAO (`<name>.sputnikv2.testnet` / `*.sputnik-dao.near`). Day-to-day ops treasury (`NEAR` + `USDC`) lives directly on the DAO (Trezu-visible); budgeted USDC funds live inside Roda escrow (`pool_unallocated` + up to `MAX_ENVELOPES = 12` envelopes).
- **Two-Step Link Consent**: `create_community` stages a community with `linked = false`; only a Sputnik `FunctionCall` proposal executed by `predecessor == dao_id` invoking `confirm_link` transitions `linked = true`.
- **Budget Deposits**: Members fund escrow via `ft_transfer_call` with `msg = {"type":"budget_deposit","community":N,"envelope":M|null}`. Deposits bump reputation (`community_volume`) and mint collective ownership shares (`1 micro-USDC = 1 share`).
- **Hard Envelope Ceilings & Rollback**: `allocate`/`community_allocate`, `spend`/`community_spend`, `add_envelope`, `set_envelope`, `create_reward_rule`, `toggle_reward_rule`, `grant_shares`, and `dissolve_community` all require `predecessor == community.dao_id`. Envelopes enforce `spent + amount <= allocated` and debit optimistically with atomic rollback in `on_spend` / `on_reward_transfer`.
- **On-Chain Reputation (0–1000)**: Updated lazily on contributions, circle completions, vault withdrawals, and community deposits. **Sybil-resistance invariant**: reputation weights real USDC capital at risk and account tenure (`contributions_ok`, `circles_completed`, `vault_withdraw_units`, `community_volume`, `tenure_days`, minus late penalties) rather than account count.
- **Dissolution & Pro-Rata Surplus**: Closing an envelope unlocks its unspent allocation back into `pool_unallocated`. `dissolve_community` requires all envelopes closed (`!active`) and locks `dissolve_surplus = pool_unallocated`, allowing shareholders to claim exact `(dissolve_surplus * user_shares) / total_shares` via `claim_surplus`.

## Admin & Upgrades

`Config.admin` is set once in `new(admin, token_id, faucet_enabled)`. The admin can call `set_token(token_id, faucet_enabled)` to switch settlement assets, `set_community_min_rep(min_reputation)` to gate community creation, `set_admin(new_admin)` to transfer governance, or `upgrade()` + `migrate()` to upgrade bytecode and preserve existing state (supports both V1 → V2 upgrade migration and idempotent V2+ upgrades). The admin cannot withdraw user deposits, alter circle membership, skip round timing, or bypass DAO `predecessor == dao_id` checks on communities.

## Development

Requirements: Rust (see `rust-toolchain.toml`), `wasm32-unknown-unknown` target. **Deploy and testnet smoke runs should be run intentionally against testnet.**

```bash
# Pure JS logic tests (no network)
node scripts/test-logic.js

# Build wasm (roda + roda-token)
npm run build
```

## Deployment & Upgrades

```bash
cp .env.example .env   # fill in accounts and NEAR_PRIVATE_KEY

npm install
npm run build
node scripts/deploy-account.js   # subaccounts + deploy + init + storage_deposit
node scripts/set-token.js        # optional: switch token / faucet flag

# E2E testnet verification
node scripts/smoke-testnet.js --alice alice.testnet --bob bob.testnet
node scripts/smoke-community.js --alice alice.testnet --bob bob.testnet

# Self-upgrade contracts in-place (with 300 TGas + state migration):
npm run upgrade -- --contract roda
npm run upgrade -- --contract token
```

Never commit private keys, `.env`, or credential files.

## Structure

```
program/
  src/
    lib.rs        # RodaContract: vaults, circles, names, faucet, upgrade/migrate, callbacks, views
    community.rs  # Community DAO escrow, envelopes, reputation, reward rules, shares & dissolution
    state.rs      # StorageKey, Config, Vault, Circle (v1-compat), Community, RepScore, RewardRule, JSON views
    events.rs     # NEP-297 EVENT_JSON helpers
    ft.rs         # FungibleTokenReceiver (deposit / contribute / budget_deposit)
    constants.rs  # rules, fee, rep weights, envelope/community bounds, gas
  token/
    src/lib.rs    # NEP-141 + NEP-145 + NEP-148 + gated mint
  scripts/        # deploy-account / upgrade / set-token / smoke-testnet / smoke-community / test-logic
```

## Error codes

Stable strings used by the mobile `friendlyError` mapper:
- **Circles & Vaults**: `RoundNotReady`, `NotYourPayout`, `NotAllPaid`, `PendingTransfer`, `CircleFull`, `CircleNotJoinable`, `CircleCodeTaken`, `InvalidCircleCode`, `InvalidCircleName`, `InvalidContribution`, `InvalidFrequency`, `VaultNotMatured`, `InsufficientBalance`, `BelowMinimumDeposit`, `FaucetCooldown`, `FaucetUnavailable`, `CooldownActive`, `NameTaken`, `NameTooShort`, `NameTooLong`, `InvalidNameChars`, `Unauthorized`, `AlreadyPaid`, `NotAMember`, `MathOverflow`, and `*NotFound` / `*NotActive` codes.
- **Community, Reputation, Rewards & Shares**: `DaoAlreadyLinked`, `AlreadyLinked`, `CommunityNotLinked`, `CommunityDissolved`, `CommunityNotDissolved`, `InvalidCommunityName`, `InvalidEnvelopeName`, `TooManyEnvelopes`, `TooManyCommunities`, `EnvelopeInactive`, `InsufficientPool`, `ExceedsEnvelope`, `InsufficientReputation`, `InvalidReputationThreshold`, `InvalidTrigger`, `TooManyRewardRules`, `ActiveEnvelopesRemaining`, `NoSharesToClaim`, `NoSurplusToClaim`, `SurplusAlreadyClaimed`.

## Events

NEP-297 logs under standard `roda` v`0.1.0`:
- **Core**: `VaultCreated`, `VaultDeposit`, `VaultWithdraw`, `VaultClosed`, `CircleCreated`, `MemberJoined`, `ContributionMade`, `PayoutReleased`, `CircleClosed`, `NameClaimed`, `NameReleased`, `FaucetClaimed`, `ContractUpgraded`, `ContractMigrated`, `AdminTransferred`.
- **Community / Rep / Rewards / Shares**: `community_create`, `community_link`, `budget_deposit`, `envelope_allocate`, `envelope_spend`, `envelope_updated`, `reputation_updated`, `reward_rule_created`, `reward_rule_toggled`, `reward_paid`, `shares_minted`, `shares_granted`, `community_dissolved`, `surplus_claimed`.

The test token also emits `nep141`/`ft_mint` on faucet mints.

## Method map (mobile / DAO / frontend)

| Action | Call |
| --- | --- |
| Create vault | `create_vault({ tier })` |
| Deposit | `ft_transfer_call` → Roda `msg={"type":"deposit","vault_id":N}` |
| Withdraw | `withdraw({ vault_id, amount })` |
| Create circle | `create_circle({ circle_code, name, max_members, contribution_amount, frequency_secs, min_reputation? })` |
| Join circle | `join_circle({ circle_code })` |
| Contribute | `ft_transfer_call` → Roda `msg={"type":"contribute","circle":N}` |
| Claim payout | `claim_payout({ circle_code })` |
| Close circle | `close_circle({ circle_code })` |
| Stage community | `create_community({ dao_id, name, envelopes })` |
| Link DAO (via Sputnik Call) | `confirm_link({ community_id })` |
| Fund budget escrow | `ft_transfer_call` → Roda `msg={"type":"budget_deposit","community":N,"envelope":M\|null}` |
| DAO budget governance | `allocate` / `community_allocate`, `spend` / `community_spend`, `add_envelope`, `set_envelope` |
| DAO rewards & ownership | `create_reward_rule`, `toggle_reward_rule`, `grant_shares`, `dissolve_community` |
| Shareholder surplus claim | `claim_surplus({ community_id })` |
| Username & Faucet | `claim_name({ name })` / `release_name()` / `faucet()` |
| Views | `get_config`, `get_vault`, `get_user_vaults`, `get_circle`, `get_circles`, `get_user_circle_ids`, `get_profile`, `get_name_owner`, `get_activity`, `get_faucet_info`, `get_community`, `get_community_by_dao`, `get_communities`, `get_user_community_ids`, `get_user_communities`, `get_envelopes`, `get_reputation`, `get_reputation_breakdown`, `get_reward_rules`, `get_community_shares`, `get_community_total_shares`, `get_community_shareholders`, `has_claimed_surplus`, `preview_surplus_claim` |
