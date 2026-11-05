import {
  connect,
  keyStores,
  providers,
  type Near,
} from 'near-api-js';

import { NEAR_NETWORK, NEAR_RPC_URL } from '../constants/roda';
import type { KeyPair } from 'near-api-js';

let provider: InstanceType<typeof providers.JsonRpcProvider> | null = null;
let near: Near | null = null;
const keyStore = new keyStores.InMemoryKeyStore();

export function getNearConnection(): InstanceType<typeof providers.JsonRpcProvider> {
  if (!provider) {
    provider = new providers.JsonRpcProvider(NEAR_RPC_URL);
  }
  return provider;
}

export async function getNear(): Promise<Near> {
  if (!near) {
    near = await connect({
      networkId: NEAR_NETWORK,
      nodeUrl: NEAR_RPC_URL,
      keyStore,
    });
  }
  return near;
}

export async function setNearKey(accountId: string, keyPair: KeyPair): Promise<void> {
  await keyStore.setKey(NEAR_NETWORK, accountId, keyPair);
}
