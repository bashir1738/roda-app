import { useQuery } from '@tanstack/react-query';
import {
  getDaoBounties,
  getDaoBountyClaims,
  getDaoProposals,
  type BountyClaim,
  type BountyOutput,
  type ProposalView,
} from '../lib/sputnik';
import { useWallet } from '../providers/WalletContext';

export function useDaoProposals(daoId?: string, limit = 30) {
  return useQuery<ProposalView[]>({
    queryKey: ['daoProposals', daoId, limit],
    enabled: !!daoId,
    refetchInterval: 20_000,
    queryFn: () => getDaoProposals(daoId!, 0, limit),
  });
}

export function useDaoBounties(daoId?: string, limit = 30) {
  return useQuery<BountyOutput[]>({
    queryKey: ['daoBounties', daoId, limit],
    enabled: !!daoId,
    refetchInterval: 25_000,
    queryFn: () => getDaoBounties(daoId!, 0, limit),
  });
}

export function useDaoBountyClaims(daoId?: string) {
  const { address } = useWallet();
  return useQuery<BountyClaim[]>({
    queryKey: ['daoBountyClaims', daoId, address],
    enabled: !!daoId && !!address,
    refetchInterval: 25_000,
    queryFn: () => getDaoBountyClaims(daoId!, address!),
  });
}
