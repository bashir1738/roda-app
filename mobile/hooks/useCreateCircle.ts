import { useCallback, useState } from 'react';
import { callContract } from '../lib/contract';
import { useProgramAction } from './useProgramAction';
import { usdcToRaw } from '../constants/roda';
import { randomCircleCode } from '../lib/circleCode';

export interface CreateCircleParams {
  name: string;
  maxMembers: number;
  contributionUSDC: number;
  frequencySeconds: number;
  minReputation?: number;
}

export function useCreateCircle() {
  const action = useProgramAction();
  const [createdCode, setCreatedCode] = useState<number | null>(null);
  const createCircle = useCallback(async (params: CreateCircleParams) => {
    const code = randomCircleCode();
    const result = await action.run((accountId) => callContract(accountId, 'create_circle', {
      circle_code: code,
      name: params.name.trim(),
      max_members: params.maxMembers,
      contribution_amount: usdcToRaw(params.contributionUSDC),
      frequency_secs: params.frequencySeconds,
      min_reputation: params.minReputation && params.minReputation > 0 ? params.minReputation : null,
    }));
    if (result) setCreatedCode(code);
    return result;
  }, [action]);
  return { createCircle, createdCode, txState: action.txState, txHash: action.txHash,
    error: action.error, isPending: action.isPending, isSuccess: action.txState === 'success',
    reset: () => { setCreatedCode(null); action.reset(); } };
}
