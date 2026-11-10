import { useCallback } from 'react';
import { callContract } from '../lib/contract';
import { useProgramAction } from './useProgramAction';

type ClaimParams =
  | { type: 'circle'; circleId: number }
  | { type: 'vault'; vaultId: number; amount?: bigint };

export function useClaim() {
  const action = useProgramAction();
  const claim = useCallback((params: ClaimParams) => action.run((accountId) =>
    callContract(
      accountId,
      params.type === 'circle' ? 'claim_payout' : 'withdraw',
      params.type === 'circle'
        ? { circle_code: params.circleId }
        : { vault_id: params.vaultId, amount: Number(params.amount ?? 0n) },
      params.type === 'circle' ? '200000000000000' : '100000000000000',
    )), [action]);
  return { claim, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
