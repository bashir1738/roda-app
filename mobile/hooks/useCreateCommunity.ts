import { useCallback, useState } from 'react';
import { callContract, viewContract } from '../lib/contract';
import { addFunctionCallProposal, createDao, ensureDaoFtRegistered } from '../lib/sputnik';
import { useProgramAction } from './useProgramAction';
import { useUsdcMint } from './useUsdcMint';

export type CreateCommunityStage =
  | 'idle'
  | 'deploying_dao'
  | 'registering_token'
  | 'staging_community'
  | 'proposing_link'
  | 'done';

export interface CreateCommunityWizardParams {
  mode: 'create' | 'link';
  name: string;
  purpose?: string;
  existingDaoId?: string;
  council: string[];
  thresholdNum?: number;
  thresholdDen?: number;
  envelopes: string[];
  proposeLinkImmediately?: boolean;
}

export function useCreateCommunity() {
  const action = useProgramAction();
  const tokenId = useUsdcMint();
  const [stage, setStage] = useState<CreateCommunityStage>('idle');
  const [createdCommunityId, setCreatedCommunityId] = useState<number | null>(null);
  const [createdDaoId, setCreatedDaoId] = useState<string | null>(null);

  const createCommunity = useCallback(
    async (params: CreateCommunityWizardParams) => {
      let latestCommunityId: number | null = null;
      let resolvedDaoId = params.existingDaoId?.trim().toLowerCase() ?? '';

      const hash = await action.run(async (accountId) => {
        if (params.mode === 'create') {
          setStage('deploying_dao');
          const council = params.council.length > 0 ? params.council : [accountId];
          const deployed = await createDao(accountId, params.name, {
            purpose: params.purpose,
            council,
            thresholdNum: params.thresholdNum,
            thresholdDen: params.thresholdDen,
          });
          resolvedDaoId = deployed.daoId;
          setCreatedDaoId(resolvedDaoId);

          setStage('registering_token');
          await ensureDaoFtRegistered(accountId, resolvedDaoId, tokenId).catch(() => null);
        } else {
          setCreatedDaoId(resolvedDaoId);
        }

        setStage('staging_community');
        const cleanEnvelopes = params.envelopes
          .map((e) => e.trim())
          .filter(Boolean)
          .slice(0, 12);

        const txHash = await callContract(
          accountId,
          'create_community',
          {
            dao_id: resolvedDaoId,
            name: params.name.trim(),
            envelopes: cleanEnvelopes,
          },
          '100000000000000',
        );

        // Fetch assigned community_id from user's community list
        const ids = await viewContract<number[]>('get_user_community_ids', { account: accountId });
        if (Array.isArray(ids) && ids.length > 0) {
          latestCommunityId = ids[ids.length - 1];
          setCreatedCommunityId(latestCommunityId);
        }

        if (params.proposeLinkImmediately !== false && latestCommunityId !== null) {
          setStage('proposing_link');
          await addFunctionCallProposal(
            accountId,
            resolvedDaoId,
            `Link Roda Community #${latestCommunityId} (${params.name.trim()})`,
            [
              {
                methodName: 'confirm_link',
                args: { community_id: latestCommunityId },
                gas: '50000000000000',
              },
            ],
          ).catch(() => null);
        }

        setStage('done');
        return txHash;
      });

      return { hash, communityId: latestCommunityId, daoId: resolvedDaoId };
    },
    [action, tokenId],
  );

  const reset = useCallback(() => {
    setStage('idle');
    setCreatedCommunityId(null);
    setCreatedDaoId(null);
    action.reset();
  }, [action]);

  return {
    createCommunity,
    stage,
    createdCommunityId,
    createdDaoId,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset,
  };
}
