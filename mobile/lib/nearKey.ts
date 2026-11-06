import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { KeyPair } from 'near-api-js';
import { KeyPairEd25519 } from 'near-api-js/lib/utils/key_pair';
import { base_encode } from 'near-api-js/lib/utils/serialize';

const ACTIVE_KEY_STORE = 'roda_near_key_v1';
const RODA_NEAR_SALT = 'roda:near:mainnet:v1:magic-deterministic-salt:';

/**
 * Generate a SecureStore-safe key identifier for an email address.
 * SecureStore keys can only contain alphanumeric characters, '.', '-', or '_'.
 */
export async function getEmailKeyStoreKey(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `roda_email_key_${normalized}`,
  );
  return `roda_k_${hash.slice(0, 32)}`;
}

/**
 * Deterministically derives an Ed25519 KeyPair from an email address.
 * Guarantees that the exact same email address always yields the exact same
 * NEAR keypair, public key, and implicit account ID.
 */
export async function deriveNearKeyForEmail(email: string): Promise<KeyPair> {
  const normalized = email.trim().toLowerCase();
  const hexHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${RODA_NEAR_SALT}${normalized}`,
  );

  const seed32 = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    seed32[i] = parseInt(hexHash.slice(i * 2, i * 2 + 2), 16);
  }

  const seedPadded = new Uint8Array(64);
  seedPadded.set(seed32);
  const tempKp = new KeyPairEd25519(base_encode(seedPadded));
  const pubBytes = tempKp.getPublicKey().data;

  const extended = new Uint8Array(64);
  extended.set(seed32, 0);
  extended.set(pubBytes, 32);

  return KeyPair.fromString(`ed25519:${base_encode(extended)}`);
}

/**
 * Load or deterministically create the NEAR KeyPair for a specific email.
 * Checks SecureStore first; if not found, derives deterministically and persists.
 * Also updates the active session key store.
 */
export async function getOrCreateNearKeyForEmail(email: string): Promise<KeyPair> {
  const storeKey = await getEmailKeyStoreKey(email);
  try {
    const existing = await SecureStore.getItemAsync(storeKey);
    if (existing) {
      const keyPair = KeyPair.fromString(existing as Parameters<typeof KeyPair.fromString>[0]);
      await SecureStore.setItemAsync(ACTIVE_KEY_STORE, keyPair.toString());
      return keyPair;
    }
  } catch (e) {
    console.warn('Could not read existing email key from SecureStore:', e);
  }

  const derived = await deriveNearKeyForEmail(email);
  try {
    await SecureStore.setItemAsync(storeKey, derived.toString());
    await SecureStore.setItemAsync(ACTIVE_KEY_STORE, derived.toString());
  } catch (e) {
    console.warn('Could not persist email key to SecureStore:', e);
  }
  return derived;
}

/**
 * Load the active NEAR KeyPair.
 */
export async function loadNearKey(): Promise<KeyPair | null> {
  const encoded = await SecureStore.getItemAsync(ACTIVE_KEY_STORE);
  return encoded
    ? KeyPair.fromString(encoded as Parameters<typeof KeyPair.fromString>[0])
    : null;
}

/**
 * Create a random device/anonymous KeyPair and set as active.
 */
export async function createNearKey(): Promise<KeyPair> {
  const key = KeyPair.fromRandom('ed25519');
  await SecureStore.setItemAsync(ACTIVE_KEY_STORE, key.toString());
  return key;
}

/**
 * Clear the active session key (leaves email-bound persistent keys intact).
 */
export async function clearNearKey(): Promise<void> {
  await SecureStore.deleteItemAsync(ACTIVE_KEY_STORE);
}

export async function getNearPublicKey(): Promise<string | null> {
  const key = await loadNearKey();
  return key?.getPublicKey().toString() ?? null;
}
