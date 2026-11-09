import { useCallback } from 'react';
import { callContract } from '../lib/contract';
import { useProgramAction } from './useProgramAction';

export interface WithdrawParams { address: string; amount?: bigint; }
export function useWithdraw() {
  const action = useProgramAction();
  const withdraw = useCallback((params: WithdrawParams) => action.run((accountId) =>
    callContract(accountId, 'withdraw', {
      vault_id: Number(params.address), amount: Number(params.amount ?? 0n),
    })), [action]);
  return { withdraw, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
