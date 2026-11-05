import * as SecureStore from 'expo-secure-store';
import { KeyPair } from 'near-api-js';

const KEY_STORE = 'roda_near_key_v1';

export async function loadNearKey(): Promise<KeyPair | null> {
  const encoded = await SecureStore.getItemAsync(KEY_STORE);
  return encoded
    ? KeyPair.fromString(encoded as Parameters<typeof KeyPair.fromString>[0])
    : null;
}

export async function createNearKey(): Promise<KeyPair> {
  const key = KeyPair.fromRandom('ed25519');
  await SecureStore.setItemAsync(KEY_STORE, key.toString());
  return key;
}

export async function clearNearKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_STORE);
}

export async function getNearPublicKey(): Promise<string | null> {
  const key = await loadNearKey();
  return key?.getPublicKey().toString() ?? null;
}
