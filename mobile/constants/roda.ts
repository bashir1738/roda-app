export const CLUSTER = 'testnet' as const;
export const NEAR_NETWORK = process.env.EXPO_PUBLIC_NEAR_NETWORK ?? 'testnet';
export const NEAR_RPC_URL =
  process.env.EXPO_PUBLIC_NEAR_RPC_URL ?? 'https://rpc.testnet.near.org';
export const CONTRACT_ID =
  process.env.EXPO_PUBLIC_CONTRACT_ID ?? 'roda.testnet';
export const FT_ID =
  process.env.EXPO_PUBLIC_FT_ID ?? 'roda-usdc.testnet';

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

/** Truncate a base58 address for display: 8gSe4…qF9S */
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
