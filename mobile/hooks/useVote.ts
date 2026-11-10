import { useCallback } from 'react';
import { actProposal, type VoteAction } from '../lib/sputnik';
import { useProgramAction } from './useProgramAction';

export function useVote() {
  const action = useProgramAction();

  const vote = useCallback(
    (daoId: string, proposalId: number, voteAction: VoteAction) =>
      action.run((accountId) => actProposal(accountId, daoId, proposalId, voteAction)),
    [action],
  );

  return {
    vote,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
