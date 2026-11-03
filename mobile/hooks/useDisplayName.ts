import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { viewContract } from '../lib/contract';

const localKey = (addr: string) => `roda:name:${addr.toLowerCase()}`;

export function fmtAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/** Resolves a display name for any address — on-chain registry first, then local. */
export function useDisplayName(address?: string) {
  const queryClient = useQueryClient();
  const [localName, setLocalName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 1. On-chain read (works for ANY address, visible to everyone)
  const { data: onChainName, refetch: refetchOnChain } = useQuery<string | null>({
    queryKey: ['name', address],
    enabled: !!address,
    staleTime: 30_000,
    queryFn: async () => {
      const profile: any = await viewContract('get_profile', { owner: address! });
      const n: string = profile?.name ?? '';
      return n.length ? n : null;
    },
  });

  // 2. Local AsyncStorage fallback (this user's own device only)
  const readLocal = useCallback(() => {
    if (!address) {
      setLocalName(null);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    AsyncStorage.getItem(localKey(address))
      .then((v) => {
        if (!v) {
          setLocalName(null);
          return;
        }
        try {
          const parsed = JSON.parse(v);
          setLocalName(typeof parsed === 'object' ? (parsed.name ?? null) : parsed);
        } catch {
          setLocalName(v);
        }
      })
      .catch(() => setLocalName(null))
      .finally(() => setLoaded(true));
  }, [address]);

  useEffect(() => {
    readLocal();
  }, [readLocal]);

  // Called AFTER a successful on-chain claim — persist locally and force UI refresh
  const saveLocal = useCallback(
    async (newName: string) => {
      if (!address) return;
      const trimmed = newName.trim().toLowerCase();
      await AsyncStorage.setItem(localKey(address), JSON.stringify({ name: trimmed }));
      setLocalName(trimmed);
      queryClient.invalidateQueries({ queryKey: ['name'] });
      refetchOnChain();
    },
    [address, queryClient, refetchOnChain]
  );

  const clearLocal = useCallback(async () => {
    if (!address) return;
    await AsyncStorage.removeItem(localKey(address));
    setLocalName(null);
    queryClient.invalidateQueries({ queryKey: ['name'] });
    refetchOnChain();
  }, [address, queryClient, refetchOnChain]);

  return {
    name: onChainName ?? localName,
    loaded,
    localName,
    onChainName: onChainName ?? null,
    saveLocal,
    clearLocal,
    refetch: refetchOnChain,
  };
}
