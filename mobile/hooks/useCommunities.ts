import { useQuery } from '@tanstack/react-query';
import { useWallet } from '../providers/WalletContext';
import { viewContract } from '../lib/contract';
import {
  getDaoNearBalance,
  getDaoPolicy,
  getDaoTokenBalance,
  isTokenRegistered,
  type PolicyView,
} from '../lib/sputnik';
import { useUsdcMint } from './useUsdcMint';

export interface EnvelopeData {
  id: number;
  name: string;
  allocated: bigint;
  spent: bigint;
  remaining: bigint;
  active: boolean;
}

export interface CommunityData {
  id: number;
  daoId: string;
  creator: string;
  name: string;
  createdTs: number;
  envelopes: EnvelopeData[];
  poolUnallocated: bigint;
  totalAllocatedRemaining: bigint;
  linked: boolean;
  dissolved: boolean;
  totalShares: bigint;
  dissolveSurplus: bigint;
}

export function mapCommunity(raw: any): CommunityData {
  const envelopes: EnvelopeData[] = (raw.envelopes ?? []).map((e: any) => ({
    id: Number(e.id),
    name: String(e.name ?? ''),
    allocated: BigInt(e.allocated ?? 0),
    spent: BigInt(e.spent ?? 0),
    remaining: BigInt(e.remaining ?? 0),
    active: Boolean(e.active),
  }));

  return {
    id: Number(raw.id),
    daoId: String(raw.dao_id ?? ''),
    creator: String(raw.creator ?? ''),
    name: String(raw.name ?? ''),
    createdTs: Number(raw.created_ts ?? 0),
    envelopes,
    poolUnallocated: BigInt(raw.pool_unallocated ?? 0),
    totalAllocatedRemaining: BigInt(raw.total_allocated_remaining ?? 0),
    linked: Boolean(raw.linked),
    dissolved: Boolean(raw.dissolved),
    totalShares: BigInt(raw.total_shares ?? 0),
    dissolveSurplus: BigInt(raw.dissolve_surplus ?? 0),
  };
}

export function useCommunities() {
  const { address } = useWallet();
  const { data, isLoading, refetch } = useQuery<CommunityData[]>({
    queryKey: ['communities', address],
    enabled: !!address,
    refetchInterval: 30_000,
    queryFn: async () => {
      const list = await viewContract<any[]>('get_user_communities', { account: address! });
      return (list ?? []).filter(Boolean).map(mapCommunity);
    },
  });

  return { communities: data ?? [], isLoading, refetch };
}

export function useCommunity(communityId: number | null | undefined) {
  const valid = typeof communityId === 'number' && !Number.isNaN(communityId) && communityId >= 0;
  return useQuery<CommunityData | null>({
    queryKey: ['community', communityId],
    enabled: valid,
    refetchInterval: 20_000,
    queryFn: async () => {
      const raw = await viewContract<any | null>('get_community', { community_id: communityId });
      return raw ? mapCommunity(raw) : null;
    },
  });
}

export async function lookupCommunityByIdOrDao(query: string): Promise<CommunityData | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const raw = await viewContract<any | null>('get_community', { community_id: Number(trimmed) });
    return raw ? mapCommunity(raw) : null;
  }
  const raw = await viewContract<any | null>('get_community_by_dao', { dao_id: trimmed.toLowerCase() });
  return raw ? mapCommunity(raw) : null;
}

export interface DaoTreasurySnapshot {
  nearYocto: string;
  usdcRaw: string;
  ftRegistered: boolean;
  policy: PolicyView | null;
}

export function useDaoTreasury(daoId?: string) {
  const tokenId = useUsdcMint();
  return useQuery<DaoTreasurySnapshot>({
    queryKey: ['daoTreasury', daoId, tokenId],
    enabled: !!daoId,
    refetchInterval: 25_000,
    queryFn: async () => {
      const [nearYocto, ftRegistered, usdcRaw, policy] = await Promise.all([
        getDaoNearBalance(daoId!).catch(() => '0'),
        isTokenRegistered(daoId!, tokenId).catch(() => false),
        getDaoTokenBalance(daoId!, tokenId).catch(() => '0'),
        getDaoPolicy(daoId!).catch(() => null),
      ]);
      return { nearYocto, ftRegistered, usdcRaw, policy };
    },
  });
}
