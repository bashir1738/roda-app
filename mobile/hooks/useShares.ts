import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callContract, viewContract } from '../lib/contract';
import { addFunctionCallProposal } from '../lib/sputnik';
import { CONTRACT_ID, usdcToRaw } from '../constants/roda';
import { useWallet } from '../providers/WalletContext';
import { useProgramAction } from './useProgramAction';

export interface ShareholderData {
  account: string;
  shares: bigint;
}

export function useShareholders(communityId: number | null | undefined) {
  const valid = typeof communityId === 'number' && !Number.isNaN(communityId) && communityId >= 0;
  return useQuery<ShareholderData[]>({
    queryKey: ['shareholders', communityId],
    enabled: valid,
    refetchInterval: 30_000,
    queryFn: async () => {
      const list = await viewContract<any[]>('get_community_shareholders', {
        community_id: communityId,
      });
      return (list ?? []).map((s) => ({
        account: String(s.account),
        shares: BigInt(s.shares ?? 0),
      }));
    },
  });
}

export function useMyShares(communityId: number | null | undefined) {
  const { address } = useWallet();
  const valid =
    typeof communityId === 'number' && !Number.isNaN(communityId) && communityId >= 0 && !!address;
  return useQuery<{ shares: bigint; claimed: boolean; claimable: bigint }>({
    queryKey: ['myShares', communityId, address],
    enabled: valid,
    refetchInterval: 25_000,
    queryFn: async () => {
      const [shares, claimed, claimable] = await Promise.all([
        viewContract<number>('get_community_shares', {
          community_id: communityId,
          account: address!,
        }),
        viewContract<boolean>('has_claimed_surplus', {
          community_id: communityId,
          account: address!,
        }),
        viewContract<number>('preview_surplus_claim', {
          community_id: communityId,
          account: address!,
        }),
      ]);
      return {
        shares: BigInt(shares ?? 0),
        claimed: Boolean(claimed),
        claimable: BigInt(claimable ?? 0),
      };
    },
  });
}

export function useOwnershipActions() {
  const action = useProgramAction();

  const proposeGrantShares = useCallback(
    (
      daoId: string,
      params: {
        communityId: number;
        recipient: string;
        shareUnits: number; // 1.00 = 1_000_000 raw share units
        minReputation?: number;
        description?: string;
      },
    ) =>
      action.run((accountId) => {
        const raw = usdcToRaw(params.shareUnits);
        const recipient = params.recipient.trim().toLowerCase();
        const desc =
          params.description?.trim() ||
          `Grant ${params.shareUnits} shares to ${recipient}`;
        return addFunctionCallProposal(
          accountId,
          daoId,
          desc,
          [
            {
              methodName: 'grant_shares',
              args: {
                community_id: params.communityId,
                recipient,
                amount: raw,
                min_reputation:
                  params.minReputation && params.minReputation > 0
                    ? params.minReputation
                    : null,
              },
              gas: '50000000000000',
            },
          ],
          CONTRACT_ID,
        );
      }),
    [action],
  );

  const proposeDissolve = useCallback(
    (daoId: string, communityId: number, description?: string) =>
      action.run((accountId) =>
        addFunctionCallProposal(
          accountId,
          daoId,
          description?.trim() ||
            `Dissolve Community #${communityId} and unlock pro-rata surplus`,
          [
            {
              methodName: 'dissolve_community',
              args: { community_id: communityId },
              gas: '60000000000000',
            },
          ],
          CONTRACT_ID,
        ),
      ),
    [action],
  );

  const claimSurplus = useCallback(
    (communityId: number) =>
      action.run((accountId) =>
        callContract(
          accountId,
          'claim_surplus',
          { community_id: communityId },
          '120000000000000',
        ),
      ),
    [action],
  );

  return {
    proposeGrantShares,
    proposeDissolve,
    claimSurplus,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
