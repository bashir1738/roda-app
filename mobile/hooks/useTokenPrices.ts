import { useQuery } from '@tanstack/react-query';

export interface TokenPrices {
  /** USD price of 1 NEAR. */
  near: number;
  /** USD price of 1 USDC. */
  usdc: number;
}

const DEFAULT_PRICES: TokenPrices = {
  near: 4.50,
  usdc: 1.00,
};

// CoinGecko free endpoint
const PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=near,usd-coin&vs_currencies=usd';

/** Live USD prices for NEAR and USDC (refreshed every 60s, with instant fallback). */
export function useTokenPrices() {
  return useQuery<TokenPrices>({
    queryKey: ['token-prices'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(PRICE_URL, { signal: controller.signal }).finally(() =>
          clearTimeout(timer),
        );
        if (!res.ok) return DEFAULT_PRICES;
        const json = (await res.json()) as Record<string, { usd?: number }>;
        return {
          near: json['near']?.usd ?? DEFAULT_PRICES.near,
          usdc: json['usd-coin']?.usd ?? DEFAULT_PRICES.usdc,
        };
      } catch {
        return DEFAULT_PRICES;
      }
    },
    initialData: DEFAULT_PRICES,
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 0,
  });
}
