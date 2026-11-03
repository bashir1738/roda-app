import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const RECOVERY_HASH_KEY = 'roda_magic_recovery_hash_v1';

function normalize(code: string): string {
  return code.trim().replace(/\s+/g, '').toUpperCase();
}

export async function createRecoveryCode(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(8);
  const code = Array.from(bytes)
    .map((value) => (value % 36).toString(36))
    .join('')
    .toUpperCase();
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalize(code),
  );
  await SecureStore.setItemAsync(RECOVERY_HASH_KEY, hash);
  return code;
}

export async function verifyRecoveryCode(code: string): Promise<boolean> {
  const expected = await SecureStore.getItemAsync(RECOVERY_HASH_KEY);
  if (!expected) return false;
  const actual = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalize(code),
  );
  if (actual !== expected) return false;
  await SecureStore.deleteItemAsync(RECOVERY_HASH_KEY);
  return true;
}
