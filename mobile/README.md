# Roda mobile

The `mobile/` package is an Expo React Native client for the Roda NEAR contracts and Sputnik DAO + Trezu coordination layer. It reads views over NEAR JSON-RPC and signs transactions using one of the supported non-custodial wallet flows:

1. **Create an in-app wallet** — an Ed25519 NEAR keypair generated locally and persisted in `Expo SecureStore`.
2. **Continue with email** — Magic OTP verification paired with encrypted device key storage and a one-time backup recovery flow.
3. **Connect External NEAR Wallets** — Meteor Wallet, MyNearWallet, and HERE Wallet via secure in-app web auth sessions (`roda://wallet-callback`). Meteor users can upgrade between Roda-only and full-account key scope to sign Sputnik DAO and USDC `ft_transfer_call` transactions directly.

## Deployed Program & Contract Addresses (NEAR Testnet)

| Role | Account ID |
| --- | --- |
| **Roda Protocol Program** | `roda.dev-92ebb0b3c42c.testnet` |
| **NEP-141 Test USDC (`rUSDC`)** | `usdc.dev-92ebb0b3c42c.testnet` |
| **Sputnik DAO Factory** | `sputnikv2.testnet` |

## Development

```bash
npm install
npx tsc --noEmit
npm run start
```

## Environment

Copy `.env.example` to `.env.local`:

```bash
EXPO_PUBLIC_NEAR_NETWORK=testnet
EXPO_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.fastnear.com
EXPO_PUBLIC_CONTRACT_ID=roda.dev-92ebb0b3c42c.testnet
EXPO_PUBLIC_FT_ID=usdc.dev-92ebb0b3c42c.testnet
EXPO_PUBLIC_SPUTNIK_FACTORY_ID=sputnikv2.testnet
EXPO_PUBLIC_TREZU_URL=https://trezu.app
EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY=
```

## Contract & DAO calls

- **Vaults**: `create_vault`, `withdraw`, `close_vault`, `ft_transfer_call` (`{"type":"deposit","vault_id":N}`)
- **Circles**: `create_circle` (with optional `min_reputation` threshold), `join_circle`, `claim_payout`, `close_circle`, `ft_transfer_call` (`{"type":"contribute","circle":N}`)
- **Community & Sputnik DAOs**: Deploy DAOs via `sputnikv2.testnet`, submit/vote on `add_proposal` / `act_proposal` (`FunctionCall`, `Transfer`, `Vote`, `AddBounty`, `BountyDone`), `confirm_link`, `allocate`, `community_spend`, `add_envelope`, `set_envelope`, and `ft_transfer_call` (`{"type":"budget_deposit","community":N,"envelope":M|null}`)
- **Reputation, Rewards & Shares**: `get_reputation_breakdown`, `create_reward_rule`, `grant_shares`, `dissolve_community`, `claim_surplus`, plus Trezu deep-linking (`trezu.app/<dao>`)
- **Names & Testnet Faucet**: `claim_name`, `release_name`, `faucet`, `get_activity`

## Structure

- `app/(tabs)/` — Home, Circles, Save (Vaults), Community (DAOs), Wallet, Profile
- `app/community/` — Community/DAO setup wizard, dashboard (envelopes, votes, rewards/bounties, shares) & proposal composer
- `lib/near.ts` — NEAR RPC failover & account helper
- `lib/nearKey.ts` — `SecureStore` keypair persistence
- `lib/contract.ts` — Roda contract views, calls, and NEP-141 transfers
- `lib/sputnik.ts` — Sputnik DAO factory deployment, proposals, voting & native bounties
- `lib/trezu.ts` — `trezu.app` deep-link helpers
- `hooks/` — React Query hooks (`useCommunities`, `useDaoProposals`, `useReputation`, `useRewardRules`, `useShares`, etc.)
- `components/` — Reusable widgets (`ReputationBadge`, `CreateCircleWizard`, `JoinByIdModal`, `CircleCard`, `ProfileSidebar`, etc.)
- `constants/roda.ts` — Network, contract, Sputnik/Trezu, token, and vault tier constants
