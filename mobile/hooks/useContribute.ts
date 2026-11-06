import { useCallback } from 'react';
import { getConfiguredTokenId, transferToken } from '../lib/contract';
import { CONTRACT_ID } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export interface ContributeParams { circleId: number; amountIn: bigint; }
export function useContribute() {
  const action = useProgramAction();
  const contribute = useCallback((params: ContributeParams) => action.run(async (accountId) =>
    transferToken(accountId, CONTRACT_ID, params.amountIn.toString(),
      JSON.stringify({ type: 'contribute', circle: params.circleId }),
      await getConfiguredTokenId())), [action]);
  return { contribute, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
