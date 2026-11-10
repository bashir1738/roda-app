import { useCallback } from 'react';
import { transferToken } from '../lib/contract';
import { CONTRACT_ID, usdcToRaw } from '../constants/roda';
import { useProgramAction } from './useProgramAction';
import { useUsdcMint } from './useUsdcMint';

export interface BudgetDepositParams {
  communityId: number;
  envelopeId?: number | null;
  amountUSDC: number;
}

export function useBudgetDeposit() {
  const action = useProgramAction();
  const tokenId = useUsdcMint();

  const depositBudget = useCallback(
    (params: BudgetDepositParams) =>
      action.run((accountId) =>
        transferToken(
          accountId,
          CONTRACT_ID,
          String(usdcToRaw(params.amountUSDC)),
          JSON.stringify({
            type: 'budget_deposit',
            community: params.communityId,
            envelope: params.envelopeId ?? null,
          }),
          tokenId,
        ),
      ),
    [action, tokenId],
  );

  return {
    depositBudget,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
