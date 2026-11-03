import { useCallback } from 'react';
import { callContract } from '../lib/contract';
import { useProgramAction } from './useProgramAction';

export function useJoinCircle() {
  const action = useProgramAction();
  const joinCircle = useCallback((circleCode: number) =>
    action.run((accountId) => callContract(accountId, 'join_circle', { circle_code: circleCode })), [action]);
  return { joinCircle, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
