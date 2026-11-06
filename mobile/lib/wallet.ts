import * as SecureStore from 'expo-secure-store';
import { KeyPair } from 'near-api-js';

import {
  clearNearKey,
  createNearKey,
  getNearPublicKey,
  getOrCreateNearKeyForEmail,
  deriveNearKeyForEmail,
  loadNearKey,
} from './nearKey';

const EMAIL_STORE = 'roda_near_email_v1';
const ADDRESS_STORE = 'roda_near_address_v1';
const KIND_STORE = 'roda_near_kind_v1';

export interface NearWallet {
  accountId: string;
  keyPair?: KeyPair;
}

export async function loadWallet(): Promise<NearWallet | null> {
  const storedEmail = await getStoredEmail();
  const storedKind = await getStoredWalletKind();

  // Email wallets are deterministic. Re-derive them on startup so the
  // authenticated email remains the source of truth for the wallet identity.
  if (storedEmail && storedKind !== 'meteor' && storedKind !== 'device') {
    return getOrCreateWalletForEmail(storedEmail);
  }

  const accountId = await getStoredAddress();
  if (!accountId) return null;
  const keyPair = await loadNearKey();
  return { accountId, keyPair: keyPair ?? undefined };
}

export async function getOrCreateWalletForEmail(email: string): Promise<NearWallet> {
  const normalized = email.trim().toLowerCase();
  const keyPair = await getOrCreateNearKeyForEmail(normalized);
  const accountId = await deviceAccountId(keyPair);
  await saveActiveAddress(accountId);
  await saveEmail(normalized);
  await saveWalletKind('magic');
  return { accountId, keyPair };
}

export async function createWallet(accountId: string): Promise<NearWallet> {
  const keyPair = await createNearKey();
  await saveActiveAddress(accountId);
  await saveWalletKind('device');
  return { accountId, keyPair };
}

export async function clearWallet(preserveEmail = false): Promise<void> {
  await clearNearKey();
  await SecureStore.deleteItemAsync(ADDRESS_STORE);
  await SecureStore.deleteItemAsync(KIND_STORE);
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
  await SecureStore.setItemAsync(EMAIL_STORE, email.trim().toLowerCase());
}

export async function saveWalletKind(kind: 'magic' | 'meteor' | 'device'): Promise<void> {
  await SecureStore.setItemAsync(KIND_STORE, kind);
}

export async function getStoredWalletKind(): Promise<string | null> {
  return SecureStore.getItemAsync(KIND_STORE);
}

export async function deviceAccountId(keyPair: KeyPair): Promise<string> {
  const bytes = keyPair.getPublicKey().data;
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export {
  createNearKey,
  getNearPublicKey,
  loadNearKey,
  getOrCreateNearKeyForEmail,
  deriveNearKeyForEmail,
};
