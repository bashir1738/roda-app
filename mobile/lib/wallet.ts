import * as SecureStore from 'expo-secure-store';
import { KeyPair } from 'near-api-js';

import { clearNearKey, createNearKey, getNearPublicKey, loadNearKey } from './nearKey';

const EMAIL_STORE = 'roda_near_email_v1';
const ADDRESS_STORE = 'roda_near_address_v1';

export interface NearWallet {
  accountId: string;
  keyPair?: KeyPair;
}

export async function loadWallet(): Promise<NearWallet | null> {
  const keyPair = await loadNearKey();
  const accountId = await getStoredAddress();
  return keyPair && accountId ? { accountId, keyPair } : null;
}

export async function createWallet(accountId: string): Promise<NearWallet> {
  const keyPair = await createNearKey();
  await saveActiveAddress(accountId);
  return { accountId, keyPair };
}

export async function clearWallet(preserveEmail = false): Promise<void> {
  await clearNearKey();
  await SecureStore.deleteItemAsync(ADDRESS_STORE);
  if (!preserveEmail) await SecureStore.deleteItemAsync(EMAIL_STORE);
}

export async function saveActiveAddress(address: string): Promise<void> {
  await SecureStore.setItemAsync(ADDRESS_STORE, address);
}

export async function getStoredAddress(): Promise<string | null> {
  return SecureStore.getItemAsync(ADDRESS_STORE);
}

export async function getStoredEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(EMAIL_STORE);
}

export async function saveEmail(email: string): Promise<void> {
  await SecureStore.setItemAsync(EMAIL_STORE, email);
}

export async function deviceAccountId(keyPair: KeyPair): Promise<string> {
  const bytes = keyPair.getPublicKey().data;
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export { createNearKey, getNearPublicKey, loadNearKey };
