import { useCallback, useState } from 'react';
import { callContract, getNearAccount, viewContract } from '../lib/contract';
import { addFunctionCallProposal, createDao, ensureDaoFtRegistered } from '../lib/sputnik';
import { useProgramAction } from './useProgramAction';
import { useUsdcMint } from './useUsdcMint';

const MIN_NEAR_FOR_DAO_CREATE = 6_150_000_000_000_000_000_000_000n; // 6.15 NEAR
const MIN_NEAR_FOR_LINK = 10_000_000_000_000_000_000_000n; // 0.01 NEAR

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
        // Verify account is activated on NEAR and holds enough NEAR before signing tx
        try {
          const account = await getNearAccount(accountId);
          const state = await account.state();
          const nearBal = BigInt(state.amount?.toString() ?? '0');
          if (params.mode === 'create' && nearBal < MIN_NEAR_FOR_DAO_CREATE) {
            throw new Error('InsufficientNearForDao');
          }
          if (params.mode === 'link' && nearBal < MIN_NEAR_FOR_LINK) {
            throw new Error('NotEnoughBalance');
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err ?? '');
          if (msg === 'InsufficientNearForDao' || msg === 'NotEnoughBalance') throw err;
          if (/doesn't exist|does not exist/i.test(msg)) {
            throw new Error('UnfundedAccount');
          }
        }

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

        // Fetch assigned community_id (with brief retry for FastNEAR replica lag)
        for (let attempt = 0; attempt < 5; attempt++) {
          const byDao = await viewContract<{ id: number } | null>('get_community_by_dao', {
            dao_id: resolvedDaoId,
          }).catch(() => null);
          if (byDao && typeof byDao.id === 'number') {
            latestCommunityId = byDao.id;
            setCreatedCommunityId(latestCommunityId);
            break;
          }
          const ids = await viewContract<number[]>('get_user_community_ids', {
            account: accountId,
          }).catch(() => []);
          if (Array.isArray(ids) && ids.length > 0) {
            latestCommunityId = ids[ids.length - 1];
            setCreatedCommunityId(latestCommunityId);
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
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
