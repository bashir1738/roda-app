import { useCallback } from 'react';
import { addFunctionCallProposal, ensureDaoFtRegistered } from '../lib/sputnik';
import { useProgramAction } from './useProgramAction';
import { useUsdcMint } from './useUsdcMint';

export function useConfirmLink() {
  const action = useProgramAction();

  const proposeConfirmLink = useCallback(
    (daoId: string, communityId: number, communityName?: string) =>
      action.run((accountId) =>
        addFunctionCallProposal(
          accountId,
          daoId,
          `Link Roda Community #${communityId}${communityName ? ` (${communityName})` : ''}`,
          [
            {
              methodName: 'confirm_link',
              args: { community_id: communityId },
              gas: '50000000000000',
            },
          ],
        ),
      ),
    [action],
  );

  return {
    proposeConfirmLink,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}

export function useRegisterDaoToken() {
  const action = useProgramAction();
  const tokenId = useUsdcMint();

  const registerDaoToken = useCallback(
    (daoId: string) =>
      action.run(async (accountId) => {
        const hash = await ensureDaoFtRegistered(accountId, daoId, tokenId);
        return hash ?? 'already-registered';
      }),
    [action, tokenId],
  );

  return {
    registerDaoToken,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    reset: action.reset,
  };
}
