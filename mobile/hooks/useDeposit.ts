import { useCallback } from 'react';
import { callContract, getConfiguredTokenId, transferToken, viewContract } from '../lib/contract';
import { CONTRACT_ID } from '../constants/roda';
import { useProgramAction } from './useProgramAction';

export interface DepositParams { tier: 0 | 1 | 2 | 3 | 4; amountIn: bigint; vaultId?: number; }
export function useDeposit() {
  const action = useProgramAction();
  const deposit = useCallback((params: DepositParams) => action.run(async (accountId) => {
    let vaultId = params.vaultId;
    if (vaultId === undefined) {
      await callContract(accountId, 'create_vault', { tier: params.tier });
      const userVaults = await viewContract<{ vault_id: number }[]>('get_user_vaults', { owner: accountId });
      const latest = userVaults?.[userVaults.length - 1];
      if (!latest) throw new Error('Failed to create vault');
      vaultId = Number(latest.vault_id);
    }
    const config = await viewContract<{ token_id: string }>('get_config');
    const tokenId = config?.token_id || await getConfiguredTokenId();
    return transferToken(accountId, CONTRACT_ID, params.amountIn.toString(),
      JSON.stringify({ type: 'deposit', vault_id: vaultId }),
      tokenId);
  }), [action]);
  return { deposit, txState: action.txState, txHash: action.txHash, error: action.error,
    isPending: action.isPending, isSuccess: action.txState === 'success', reset: action.reset };
}
