import { useEffect, useState } from 'react';

/** Testnet account funding is an explicit faucet action, not an auto-airdrop. */
export function useFundWallet(address: string | undefined) {
  const [isFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  useEffect(() => {
    if (address) setFundingError(null);
  }, [address]);
  return { isFunding, fundingError };
}
