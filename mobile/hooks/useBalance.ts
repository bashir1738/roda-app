import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { getNearAccount, viewContract } from '../lib/contract';

export interface Balances { near: bigint; usdc: bigint; }
export function useBalance() {
  const { address } = useWallet();
  const { data, isLoading, refetch } = useQuery<Balances>({
    queryKey: ['balance', address], enabled: !!address, refetchInterval: 30_000,
    queryFn: async () => {
      const account = await getNearAccount(address!);
      const state = await account.state();
      const usdc = await viewContract<string>('ft_balance_of', { account_id: address! })
        .catch(() => '0');
      return { near: BigInt(state.amount.toString()), usdc: BigInt(usdc) };
    },
  });
  return { near: data?.near ?? 0n, usdc: data?.usdc ?? 0n, isLoading, refetch };
}
