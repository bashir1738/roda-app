import { useCallback } from 'react';
import { addFunctionCallProposal } from '../lib/sputnik';
import { CONTRACT_ID, usdcToRaw } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export interface AllocateParams {
  daoId: string;
  communityId: number;
  envelopeId: number;
  envelopeName?: string;
  amountUSDC: number;
  description?: string;
}

export function useAllocate() {
  const action = useProgramAction();

  const proposeAllocate = useCallback(
    (params: AllocateParams) =>
      action.run((accountId) => {
        const raw = usdcToRaw(params.amountUSDC);
        const desc =
          params.description?.trim() ||
          `Allocate $${params.amountUSDC} USDC to ${params.envelopeName ?? `Envelope #${params.envelopeId}`}`;
        return addFunctionCallProposal(
          accountId,
          params.daoId,
          desc,
          [
            {
              methodName: 'allocate',
              args: {
                community_id: params.communityId,
                envelope_id: params.envelopeId,
                amount: raw,
              },
              gas: '50000000000000',
            },
          ],
          CONTRACT_ID,
        );
      }),
    [action],
  );

  return {
    proposeAllocate,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
