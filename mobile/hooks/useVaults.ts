import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { viewContract } from '../lib/contract';
import { VAULT_TIERS as TIER_INFOS } from '../constants/roda';

export type VaultTier = 'Flex' | 'Weekly' | 'Monthly' | '6 Months' | '1 Year';
const LABELS: VaultTier[] = ['Flex', 'Weekly', 'Monthly', '6 Months', '1 Year'];
export const VAULT_TIERS = Object.fromEntries(TIER_INFOS.map((t, i) => [LABELS[i], {
  tier: t.tier, key: t.key, label: LABELS[i], name: t.name, minUSDC: t.minUsdc,
  lockDays: t.lockDays, icon: 'leaf-outline', description: t.description,
}])) as Record<VaultTier, any>;
export const TIER_KEYS = LABELS;
export const tierKeyFor = (tier: number): VaultTier => LABELS[tier] ?? 'Flex';
export interface VaultData {
  address: string; id: number; owner: string; tier: 0 | 1 | 2 | 3 | 4; tierKey: VaultTier;
  balance: bigint; principalUSDC: bigint; currentBalanceUSDC: bigint;
  depositTimestamp: number; maturityTimestamp: number; lockDuration: number;
  isMatured: boolean; active: boolean;
}
export function useVaults() {
  const { address } = useWallet();
  const { data, isLoading } = useQuery<VaultData[]>({
    queryKey: ['vaults', address], enabled: !!address, refetchInterval: 60_000,
    queryFn: async () => (await viewContract<any[]>('get_user_vaults', { owner: address! })).map((v) => {
      const tier = Number(v.tier) as 0 | 1 | 2 | 3 | 4;
      const balance = BigInt(v.balance ?? 0);
      const maturity = Number(v.maturity_ts ?? 0);
      return { address: String(v.vault_id), id: Number(v.vault_id), owner: String(v.owner),
        tier, tierKey: tierKeyFor(tier), balance, principalUSDC: balance,
        currentBalanceUSDC: balance, depositTimestamp: Number(v.last_deposit_ts ?? 0),
        maturityTimestamp: maturity, lockDuration: Math.max(0, maturity - Number(v.last_deposit_ts ?? 0)),
        isMatured: Date.now() / 1000 >= maturity, active: Boolean(v.active) };
    }).filter((v) => v.active && v.balance > 0n),
  });
  return { vaults: data ?? [], isLoading };
}
