import { useQuery } from '@tanstack/react-query';

export interface TokenPrices {
  /** USD price of 1 USDC. */
  usdc: number;
}

// CoinGecko free endpoint — no API key required.
const PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=usd&precision=8';

/** Live USD prices for SOL and USDC (refreshed every 60s). */
export function useTokenPrices() {
  return useQuery<TokenPrices>({
    queryKey: ['token-prices'],
    queryFn: async () => {
      const res = await fetch(PRICE_URL);
      if (!res.ok) throw new Error(`price fetch failed: ${res.status}`);
      const json = (await res.json()) as Record<string, { usd?: number }>;
      return { usdc: json['usd-coin']?.usd ?? 1 };
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  });
}
