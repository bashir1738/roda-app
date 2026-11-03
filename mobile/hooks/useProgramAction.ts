import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet, type TxState } from '../providers/WalletContext';
import { friendlyError } from '../lib/sendTx';

export interface ProgramAction {
  txState: TxState;
  txHash: string | null;
  error: string | null;
  isPending: boolean;
  reset: () => void;
  run: (build: (accountId: string) => Promise<string>) => Promise<string | null>;
}

export function useProgramAction(): ProgramAction {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [txState, setTxState] = useState<TxState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setTxState('idle'); setTxHash(null); setError(null);
  }, []);

  const run = useCallback(async (build: (accountId: string) => Promise<string>) => {
    if (!address) {
      setError('Connect a wallet first.'); setTxState('error'); return null;
    }
    setTxState('signing'); setError(null); setTxHash(null);
    try {
      const hash = await build(address);
      setTxHash(hash); setTxState('success'); queryClient.invalidateQueries();
      return hash;
    } catch (e) {
      setError(friendlyError(e)); setTxState('error'); return null;
    }
  }, [address, queryClient]);

  return { txState, txHash, error, isPending: txState === 'signing', reset, run };
}
