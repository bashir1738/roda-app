import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { callContract, viewContract } from '../lib/contract';
import { useWallet } from '../providers/WalletContext';
import { useProgramAction } from './useProgramAction';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const normalizeName = (name: string) => name.trim().toLowerCase();
export function validateName(name: string): string | null {
  const value = normalizeName(name);
  if (value.length < USERNAME_MIN) return `Name must be at least ${USERNAME_MIN} characters.`;
  if (value.length > USERNAME_MAX) return `Name must be at most ${USERNAME_MAX} characters.`;
  return /^[a-z0-9_]+$/.test(value) ? null : 'Use lowercase letters, numbers and underscores only.';
}
export async function checkNameAvailable(name: string): Promise<boolean> {
  if (validateName(name)) return false;
  return !(await viewContract<string | null>('get_name_owner', { name: normalizeName(name) }));
}
export function useUsername(address?: string) {
  const { address: mine } = useWallet();
  const target = address ?? mine;
  const action = useProgramAction();
  const { data: onChainName, refetch } = useQuery<string | null>({
    queryKey: ['name', target], enabled: !!target,
    queryFn: () => viewContract<any>('get_profile', { owner: target! }).then((p) => p?.name || null),
  });
  const claim = useCallback((name: string) => {
    const invalid = validateName(name);
    if (invalid) return action.run(async () => { throw new Error(invalid); });
    return action.run((accountId) => callContract(accountId, 'claim_name', { name: normalizeName(name) })
      .then((hash) => { refetch(); return hash; }));
  }, [action, refetch]);
  const release = useCallback(() => action.run((accountId) =>
    callContract(accountId, 'release_name').then((hash) => { refetch(); return hash; })), [action, refetch]);
  return { onChainName: onChainName ?? null, claimState: action.txState, claimError: action.error,
    txHash: action.txHash, claim, release, reset: action.reset, isPending: action.isPending,
    isSuccess: action.txState === 'success' };
}
