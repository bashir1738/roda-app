export const CLUSTER = 'testnet' as const;
export const NEAR_NETWORK = process.env.EXPO_PUBLIC_NEAR_NETWORK ?? 'testnet';
export const TESTNET_RPC_ENDPOINTS = [
  'https://test.rpc.fastnear.com',
  'https://rpc.testnet.fastnear.com',
  'https://rpc.testnet.near.org',
] as const;
export const NEAR_RPC_URL =
  process.env.EXPO_PUBLIC_NEAR_RPC_URL ?? TESTNET_RPC_ENDPOINTS[0];
export const CONTRACT_ID =
  process.env.EXPO_PUBLIC_CONTRACT_ID ?? 'roda.dev-92ebb0b3c42c.testnet';
export const FT_ID =
  process.env.EXPO_PUBLIC_FT_ID ?? 'usdc.dev-92ebb0b3c42c.testnet';

// ─── Sputnik DAO + Trezu (Phase 0) ────────────────────────────────────────────

export const SPUTNIK_FACTORY_ID =
  process.env.EXPO_PUBLIC_SPUTNIK_FACTORY_ID ??
  (NEAR_NETWORK === 'mainnet' ? 'sputnik-dao.near' : 'sputnikv2.testnet');

export const SPUTNIK_DAO_SUFFIX = SPUTNIK_FACTORY_ID;

export const TREZU_BASE_URL =
  process.env.EXPO_PUBLIC_TREZU_URL ?? 'https://trezu.app';

/** Default 0.1 NEAR proposal/bounty bond (in yoctoNEAR). */
export const PROPOSAL_BOND = '100000000000000000000000';

/** Minimum factory deposit for subaccount + Sputnik DAO WASM storage (~6 NEAR). */
export const DAO_CREATE_DEPOSIT = '6000000000000000000000000';

/** NEP-141 storage_deposit amount (0.00125 NEAR in yoctoNEAR). */
export const FT_STORAGE_DEPOSIT = '1250000000000000000000';

/** 7 days in nanoseconds. */
export const DEFAULT_VOTE_PERIOD_NS = '604800000000000';

/** 24 hours in nanoseconds (bounty forgiveness / grace window). */
export const DEFAULT_GRACE_PERIOD_NS = '86400000000000';

export const MAX_ENVELOPES = 12;

export const USDC_DECIMALS = 6;

export const USDC_FACTOR = 10 ** USDC_DECIMALS;

/** USDC available per faucet claim. */
export const FAUCET_AMOUNT_USDC = 1_000;

// ─── Vault tiers (mirrors program state.rs) ───────────────────────────────────

export interface VaultTierInfo {
  /** Onchain VaultTier discriminant (0-4). */
  tier: 0 | 1 | 2 | 3 | 4;
  key: 'flex' | 'weekly' | 'monthly' | 'sixMonths' | 'oneYear';
  name: string;
  /** Minimum deposit in whole USDC (0 = any amount). */
  minUsdc: number;
  /** Lock duration in days (0 = no lock). */
  lockDays: number;
  description: string;
}

export const VAULT_TIERS: VaultTierInfo[] = [
  {
    tier: 0,
    key: 'flex',
    name: 'Flex Solo',
    minUsdc: 0,
    lockDays: 0,
    description: 'Save at your own pace. Add funds whenever you have extra cash. Withdraw anytime.',
  },
  {
    tier: 1,
    key: 'weekly',
    name: 'Weekly Solo',
    minUsdc: 10,
    lockDays: 7,
    description: 'Build consistency. Lock in a weekly amount to slowly build your personal pot.',
  },
  {
    tier: 2,
    key: 'monthly',
    name: 'Monthly Solo',
    minUsdc: 50,
    lockDays: 30,
    description: 'Pay yourself first. Set aside a fixed chunk of your paycheck every month.',
  },
  {
    tier: 3,
    key: 'sixMonths',
    name: '6-Month Solo',
    minUsdc: 100,
    lockDays: 182,
    description: 'Build a stronger cushion with a six-month commitment.',
  },
  {
    tier: 4,
    key: 'oneYear',
    name: '1-Year Solo',
    minUsdc: 250,
    lockDays: 365,
    description: 'Commit for the long term and grow your savings over a full year.',
  },
];

export const tierInfo = (tier: number): VaultTierInfo =>
  VAULT_TIERS.find((t) => t.tier === tier) ?? VAULT_TIERS[0];

// ─── Circle frequency presets (seconds) ───────────────────────────────────────

export const FREQUENCY_PRESETS = [
  { label: '10 minutes', seconds: 600 },
  { label: 'Weekly', seconds: 7 * 24 * 60 * 60 },
  { label: 'Bi-weekly', seconds: 14 * 24 * 60 * 60 },
  { label: 'Monthly', seconds: 30 * 24 * 60 * 60 },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncate a NEAR account ID or address for display */
export const shortAddress = (address?: string | null, head = 4, tail = 4) =>
  address ? `${address.slice(0, head)}…${address.slice(-tail)}` : '';

/** Format a USDC amount (raw 6-decimal units) for display. */
export const formatUsdc = (raw: number | bigint) => {
  const n = Number(raw) / USDC_FACTOR;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};

export const usdcToRaw = (amount: number) => Math.round(amount * USDC_FACTOR);

export const isValidAddress = (value: string) =>
  /^[a-z0-9._-]{2,64}$/.test(value);

/** Format raw collective ownership shares (1_000_000 units = 1.00 share). */
export const formatShares = (raw: number | bigint) => {
  const n = Number(raw) / USDC_FACTOR;
  return n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
};
