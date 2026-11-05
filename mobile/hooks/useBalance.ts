import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { getNearAccount, viewToken } from '../lib/contract';

export interface Balances {
  near: bigint;
  usdc: bigint;
}

const DEFAULT_BALANCES: Balances = {
  near: 0n,
  usdc: 0n,
};

export function useBalance() {
  const { address } = useWallet();

  const { data, isLoading, isFetching, refetch } = useQuery<Balances>({
    queryKey: ['balance', address],
    enabled: !!address,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
    queryFn: async (): Promise<Balances> => {
      if (!address) return DEFAULT_BALANCES;

      // 1. Fetch NEAR native balance with a strict timeout
      const nearPromise = (async (): Promise<bigint> => {
        try {
          const account = await getNearAccount(address);
          const statePromise = account.state();
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 4500),
          );
          const state = await Promise.race([statePromise, timeout]);
          return BigInt(state.amount?.toString() ?? '0');
        } catch {
          // Account may not be deployed or funded yet on testnet
          return 0n;
        }
      })();

      // 2. Fetch USDC NEP-141 token balance with a strict timeout
      const usdcPromise = (async (): Promise<bigint> => {
        try {
          const timeout = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 4500),
          );
          const query = viewToken<string>('ft_balance_of', { account_id: address });
          const raw = await Promise.race([query, timeout]);
          if (!raw) return 0n;
          const clean = raw.toString().replace(/[^0-9]/g, '');
          return clean ? BigInt(clean) : 0n;
        } catch {
          // Token contract may not exist or account has zero balance
          return 0n;
        }
      })();

      const [near, usdc] = await Promise.all([nearPromise, usdcPromise]);
      return { near, usdc };
    },
  });

  return {
    near: data?.near ?? 0n,
    usdc: data?.usdc ?? 0n,
    isLoading: isLoading && !data,
    isFetching,
    refetch,
  };
}
