import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { viewContract } from '../lib/contract';
import { addFunctionCallProposal } from '../lib/sputnik';
import { CONTRACT_ID, usdcToRaw } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export type RewardTrigger =
  | { kind: 'circle_round_completed' }
  | { kind: 'streak'; min_contributions: number };

export interface RewardRuleData {
  id: number;
  communityId: number;
  sourceEnvelope: number;
  circleCode: number | null;
  trigger: RewardTrigger;
  amount: bigint;
  active: boolean;
  totalPaid: bigint;
  payoutsCount: number;
}

export function useRewardRules(communityId: number | null | undefined) {
  const valid = typeof communityId === 'number' && !Number.isNaN(communityId) && communityId >= 0;
  return useQuery<RewardRuleData[]>({
    queryKey: ['rewardRules', communityId],
    enabled: valid,
    refetchInterval: 30_000,
    queryFn: async () => {
      const list = await viewContract<any[]>('get_reward_rules', {
        community_id: communityId,
      });
      return (list ?? []).map((r) => ({
        id: Number(r.id),
        communityId: Number(r.community_id),
        sourceEnvelope: Number(r.source_envelope),
        circleCode: r.circle_code != null ? Number(r.circle_code) : null,
        trigger: r.trigger,
        amount: BigInt(r.amount ?? 0),
        active: Boolean(r.active),
        totalPaid: BigInt(r.total_paid ?? 0),
        payoutsCount: Number(r.payouts_count ?? 0),
      }));
    },
  });
}

export function useRewardRuleProposals() {
  const action = useProgramAction();

  const proposeCreateRule = useCallback(
    (
      daoId: string,
      params: {
        communityId: number;
        sourceEnvelope: number;
        circleCode?: number | null;
        trigger: RewardTrigger;
        amountUSDC: number;
        description?: string;
      },
    ) =>
      action.run((accountId) => {
        const triggerLabel =
          params.trigger.kind === 'circle_round_completed'
            ? 'Circle Round Completed'
            : `${params.trigger.min_contributions}+ Contributions Streak`;
        const desc =
          params.description?.trim() ||
          `Create $${params.amountUSDC} USDC auto-reward (${triggerLabel})`;

        return addFunctionCallProposal(
          accountId,
          daoId,
          desc,
          [
            {
              methodName: 'create_reward_rule',
              args: {
                community_id: params.communityId,
                source_envelope: params.sourceEnvelope,
                circle_code: params.circleCode ?? null,
                trigger: params.trigger,
                amount: usdcToRaw(params.amountUSDC),
              },
              gas: '50000000000000',
            },
          ],
          CONTRACT_ID,
        );
      }),
    [action],
  );

  const proposeToggleRule = useCallback(
    (daoId: string, communityId: number, ruleId: number, nextActive: boolean) =>
      action.run((accountId) =>
        addFunctionCallProposal(
          accountId,
          daoId,
          `${nextActive ? 'Enable' : 'Pause'} reward rule #${ruleId}`,
          [
            {
              methodName: 'toggle_reward_rule',
              args: {
                community_id: communityId,
                rule_id: ruleId,
                active: nextActive,
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
    proposeCreateRule,
    proposeToggleRule,
    txState: action.txState,
    txHash: action.txHash,
    error: action.error,
    isPending: action.isPending,
    isSuccess: action.txState === 'success',
    reset: action.reset,
  };
}
