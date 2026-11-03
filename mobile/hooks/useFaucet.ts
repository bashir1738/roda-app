import { useCallback } from 'react';
import { callContract } from '../lib/contract';
import { useProgramAction } from './useProgramAction';

export function useFaucet() {
  const action = useProgramAction();
  const claim = useCallback(() => action.run((accountId) => callContract(accountId, 'faucet')), [action]);
  return { claim, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
