import { useQuery } from '@tanstack/react-query';
import { viewContract } from '../lib/contract';
import { useWallet } from '../providers/WalletContext';

export interface RepScoreData {
  account: string;
  score: number;
  updatedTs: number;
  contributionsOk: number;
  contributionsMissed: number;
  circlesCompleted: number;
  tenureDays: number;
  vaultWithdrawUnits: number;
  communityVolume: bigint;
}

export interface RepBreakdownData extends RepScoreData {
  reliabilityPts: number;
  completionPts: number;
  vaultPts: number;
  volumePts: number;
  tenurePts: number;
  penaltyPts: number;
  sybilNote: string;
}

export function getReputationTier(score: number): {
  label: string;
  color: string;
} {
  if (score >= 700) return { label: 'Founding Pillar', color: '#F59E0B' };
  if (score >= 450) return { label: 'Community Steward', color: '#00C08B' };
  if (score >= 200) return { label: 'Trusted Saver', color: '#10B981' };
  if (score >= 50) return { label: 'Active Member', color: '#3B82F6' };
  return { label: 'Newcomer', color: '#8E8E93' };
}

export function useReputation(account?: string) {
  const { address } = useWallet();
  const target = account ?? address;

  return useQuery<RepBreakdownData | null>({
    queryKey: ['reputation', target],
    enabled: !!target,
    staleTime: 30_000,
    queryFn: async () => {
      const raw = await viewContract<any>('get_reputation_breakdown', {
        account: target!,
      });
      if (!raw) return null;
      return {
        account: String(raw.account),
        score: Number(raw.score ?? 0),
        updatedTs: Number(raw.updated_ts ?? 0),
        reliabilityPts: Number(raw.reliability_pts ?? 0),
        completionPts: Number(raw.completion_pts ?? 0),
        vaultPts: Number(raw.vault_pts ?? 0),
        volumePts: Number(raw.volume_pts ?? 0),
        tenurePts: Number(raw.tenure_pts ?? 0),
        penaltyPts: Number(raw.penalty_pts ?? 0),
        contributionsOk: Number(raw.contributions_ok ?? 0),
        contributionsMissed: Number(raw.contributions_missed ?? 0),
        circlesCompleted: Number(raw.circles_completed ?? 0),
        tenureDays: Number(raw.tenure_days ?? 0),
        vaultWithdrawUnits: Number(raw.vault_withdraw_units ?? 0),
        communityVolume: BigInt(raw.community_volume ?? 0),
        sybilNote: String(raw.sybil_note ?? ''),
      };
    },
  });
}

export function useCommunityMinRepGate() {
  return useQuery<number>({
    queryKey: ['communityMinRep'],
    staleTime: 60_000,
    queryFn: async () => {
      const cfg = await viewContract<{ community_min_rep?: number }>('get_config');
      return Number(cfg?.community_min_rep ?? 0);
    },
  });
}
