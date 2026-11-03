import {
  connect,
  keyStores,
  providers,
  type Near,
  type Connection,
} from 'near-api-js';

import { NEAR_NETWORK, NEAR_RPC_URL } from '../constants/roda';
import type { KeyPair } from 'near-api-js';

let connection: Connection | null = null;
let near: Near | null = null;
const keyStore = new keyStores.InMemoryKeyStore();

export function getNearConnection(): Connection {
  if (!connection) {
    connection = new providers.JsonRpcProvider(NEAR_RPC_URL);
  }
  return connection;
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
