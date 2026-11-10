import { useCallback } from 'react';
import {
  addBountyDoneProposal,
  addBountyProposal,
  addFunctionCallProposal,
  addProposal,
  addTransferProposal,
  claimBounty,
  giveupBounty,
  type BountySpec,
  type RodaActionCallSpec,
} from '../lib/sputnik';
import { usdcToRaw } from '../constants/roda';
import { useProgramAction } from './useProgramAction';
import { useUsdcMint } from './useUsdcMint';

export function useCreateProposal() {
  const action = useProgramAction();
  const tokenId = useUsdcMint();

  const proposeTransfer = useCallback(
    (
      daoId: string,
      params: {
        asset: 'USDC' | 'NEAR';
        receiverId: string;
        amount: string; // human amount in USDC or NEAR
        description: string;
      },
    ) =>
      action.run((accountId) => {
        const numeric = parseFloat(params.amount);
        const rawAmount =
          params.asset === 'USDC'
            ? String(usdcToRaw(numeric))
            : (BigInt(Math.round(numeric * 1000)) * 10n ** 21n).toString();
        return addTransferProposal(accountId, daoId, params.description, {
          tokenId: params.asset === 'USDC' ? tokenId : '',
          receiverId: params.receiverId.trim().toLowerCase(),
          amount: rawAmount,
          msg: null,
        });
      }),
    [action, tokenId],
  );

  const proposeCall = useCallback(
    (
      daoId: string,
      description: string,
      actions: RodaActionCallSpec[],
      receiverId?: string,
    ) =>
      action.run((accountId) =>
        addFunctionCallProposal(accountId, daoId, description, actions, receiverId),
      ),
    [action],
  );

  const proposeVote = useCallback(
    (daoId: string, description: string) =>
      action.run((accountId) =>
        addProposal(accountId, daoId, {
          description,
          kind: 'Vote',
        }),
      ),
    [action],
  );

  const proposeAddBounty = useCallback(
    (
      daoId: string,
      params: {
        description: string;
        amountUSDC: number;
        times: number;
        deadlineDays: number;
      },
    ) =>
      action.run((accountId) => {
        const bounty: BountySpec = {
          description: params.description.trim(),
          token: tokenId,
          amount: String(usdcToRaw(params.amountUSDC)),
          times: Math.max(1, params.times),
          max_deadline: (BigInt(Math.max(1, params.deadlineDays)) * 86_400_000_000_000n).toString(),
        };
        return addBountyProposal(accountId, daoId, params.description.trim(), bounty);
      }),
    [action, tokenId],
  );

  const proposeBountyDone = useCallback(
    (daoId: string, bountyId: number, receiverId: string, description?: string) =>
      action.run((accountId) =>
        addBountyDoneProposal(
          accountId,
          daoId,
          description ?? `Complete bounty #${bountyId} for ${receiverId}`,
          bountyId,
          receiverId.trim().toLowerCase(),
        ),
      ),
    [action],
  );

  return {
    proposeTransfer,
    proposeCall,
    proposeVote,
    proposeAddBounty,
    proposeBountyDone,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}

export function useBountyAction() {
  const action = useProgramAction();

  const claim = useCallback(
    (daoId: string, bountyId: number, maxDeadlineNs: string) =>
      action.run((accountId) => {
        const absDeadline = (
          BigInt(Date.now()) * 1_000_000n +
          BigInt(maxDeadlineNs || '604800000000000')
        ).toString();
        return claimBounty(accountId, daoId, bountyId, absDeadline);
      }),
    [action],
  );

  const giveup = useCallback(
    (daoId: string, bountyId: number) =>
      action.run((accountId) => giveupBounty(accountId, daoId, bountyId)),
    [action],
  );

  return {
    claim,
    giveup,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
