import { useCallback } from 'react';
import { addFunctionCallProposal } from '../lib/sputnik';
import { CONTRACT_ID, usdcToRaw } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export interface SpendProposalParams {
  daoId: string;
  communityId: number;
  envelopeId: number;
  envelopeName?: string;
  recipient: string;
  amountUSDC: number;
  memo?: string;
}

export function useSpend() {
  const action = useProgramAction();

  const proposeSpend = useCallback(
    (params: SpendProposalParams) =>
      action.run((accountId) => {
        const raw = usdcToRaw(params.amountUSDC);
        const recipient = params.recipient.trim().toLowerCase();
        const desc =
          params.memo?.trim() ||
          `Spend $${params.amountUSDC} USDC from ${params.envelopeName ?? `Envelope #${params.envelopeId}`} to ${recipient}`;

        return addFunctionCallProposal(
          accountId,
          params.daoId,
          desc,
          [
            {
              methodName: 'community_spend',
              args: {
                community_id: params.communityId,
                envelope_id: params.envelopeId,
                recipient,
                amount: raw,
              },
              gas: '100000000000000',
            },
          ],
          CONTRACT_ID,
        );
      }),
    [action],
  );

  const proposeAddEnvelope = useCallback(
    (daoId: string, communityId: number, name: string) =>
      action.run((accountId) =>
        addFunctionCallProposal(
          accountId,
          daoId,
          `Add budget envelope "${name.trim()}"`,
          [
            {
              methodName: 'add_envelope',
              args: { community_id: communityId, name: name.trim() },
              gas: '40000000000000',
            },
          ],
          CONTRACT_ID,
        ),
      ),
    [action],
  );

  const proposeSetEnvelope = useCallback(
    (
      daoId: string,
      communityId: number,
      envelopeId: number,
      opts: { name?: string; active?: boolean; description?: string },
    ) =>
      action.run((accountId) =>
        addFunctionCallProposal(
          accountId,
          daoId,
          opts.description ??
            (opts.active === false
              ? `Close envelope #${envelopeId}`
              : `Update envelope #${envelopeId}`),
          [
            {
              methodName: 'set_envelope',
              args: {
                community_id: communityId,
                envelope_id: envelopeId,
                name: opts.name ?? null,
                active: opts.active ?? null,
              },
              gas: '40000000000000',
            },
          ],
          CONTRACT_ID,
        ),
      ),
    [action],
  );

  return {
    proposeSpend,
    proposeAddEnvelope,
    proposeSetEnvelope,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
