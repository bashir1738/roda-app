import { useCallback } from 'react';
import { callContract, transferToken, viewContract } from '../lib/contract';
import { CONTRACT_ID } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export interface DepositParams { tier: 0 | 1 | 2 | 3 | 4; amountIn: bigint; vaultId?: number; }
export function useDeposit() {
  const action = useProgramAction();
  const deposit = useCallback((params: DepositParams) => action.run(async (accountId) => {
    const config = params.vaultId === undefined
      ? await viewContract<{ vault_count: number }>('get_config')
      : null;
    const vaultId = params.vaultId ?? Number(config?.vault_count ?? 0);
    if (params.vaultId === undefined) await callContract(accountId, 'create_vault', { tier: params.tier });
    return transferToken(accountId, CONTRACT_ID, params.amountIn.toString(),
      JSON.stringify({ type: 'deposit', vault_id: vaultId }));
  }), [action]);
  return { deposit, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
