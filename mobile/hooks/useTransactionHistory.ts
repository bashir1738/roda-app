import { useState, useEffect, useCallback } from 'react';
import { viewContract } from '../lib/contract';
import type { Transaction } from '../components/TransactionItem';

const MAX_TXS = 50;
export function useTransactionHistory(address: string | undefined) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchHistory = useCallback(async () => {
    if (!address) { setTxs([]); return; }
    setIsLoading(true);
    try {
      const activity = await viewContract<any[]>('get_activity', { account: address });
      setTxs(activity.slice(-MAX_TXS).reverse().map((entry, index) => ({
        id: `${entry.kind}-${entry.ts}-${index}`,
        date: new Date(Number(entry.ts) * 1000),
        txHash: '',
        type: entry.kind === 'payout' ? 'payout' : entry.kind === 'contribute' ? 'contribution' : entry.kind === 'deposit' ? 'deposit' : 'claim',
        label: entry.kind.replaceAll('_', ' '),
        subLabel: entry.circle_id ? `Circle #${entry.circle_id}` : entry.vault_id ? `Vault #${entry.vault_id}` : '',
        amountUSDC: BigInt(entry.amount ?? 0),
      } as Transaction)));
    } catch (error) {
      if (__DEV__) console.warn('[activity]', error);
    } finally { setIsLoading(false); }
  }, [address]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);
  return { txs, isLoading, refresh: fetchHistory };
}
