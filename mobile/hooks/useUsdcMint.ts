import { useQuery } from '@tanstack/react-query';
import { viewContract } from '../lib/contract';
import { FT_ID } from '../constants/roda';

export async function syncUsdcMint(): Promise<string> {
  const config = await viewContract<{ token_id: string }>('get_config');
  return config.token_id;
}
export function useUsdcMint(): string {
  const { data } = useQuery({ queryKey: ['tokenId'], queryFn: syncUsdcMint, staleTime: 60_000 });
  return data ?? FT_ID;
}
