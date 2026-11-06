import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { getConfiguredTokenId, getNearAccount, viewToken } from '../lib/contract';

export interface Balances {
  near: bigint;
  usdc: bigint;
  usdcError?: string;
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
          const tokenId = await getConfiguredTokenId();
          const timeout = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 4500),
          );
          const query = viewToken<string>('ft_balance_of', { account_id: address }, tokenId);
          const raw = await Promise.race([query, timeout]);
          if (!raw) return 0n;
          const clean = raw.toString().replace(/[^0-9]/g, '');
          return clean ? BigInt(clean) : 0n;
        } catch (error) {
          throw new Error(
            `USDC token is unavailable. Check the deployed token contract and network. ${
              error instanceof Error ? error.message : ''
            }`.trim(),
          );
        }
      })();

      const [near, usdcResult] = await Promise.all([
        nearPromise,
        usdcPromise.then(
          (value) => ({ value, error: undefined }),
          (error: unknown) => ({
            value: 0n,
            error: error instanceof Error ? error.message : 'USDC balance unavailable.',
          }),
        ),
      ]);
      return { near, usdc: usdcResult.value, usdcError: usdcResult.error };
    },
  });

  return {
    near: data?.near ?? 0n,
    usdc: data?.usdc ?? 0n,
    usdcError: data?.usdcError,
    isLoading: isLoading && !data,
    isFetching,
    refetch,
  };
}
