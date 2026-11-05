import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { getNearAccount, viewToken } from '../lib/contract';

export interface Balances { near: bigint; usdc: bigint; }
export function useBalance() {
  const { address } = useWallet();
  const { data, isLoading, refetch } = useQuery<Balances>({
    queryKey: ['balance', address], enabled: !!address, refetchInterval: 30_000,
    queryFn: async () => {
      let nearAmount = 0n;
      try {
        const account = await getNearAccount(address!);
        const state = await account.state();
        nearAmount = BigInt(state.amount.toString());
      } catch {
        // Account may not be deployed / active on-chain yet
        nearAmount = 0n;
      }
      const usdc = await viewToken<string>('ft_balance_of', { account_id: address! })
        .catch(() => '0');
      return { near: nearAmount, usdc: BigInt(usdc) };
    },
  });
  return { near: data?.near ?? 0n, usdc: data?.usdc ?? 0n, isLoading, refetch };
}
