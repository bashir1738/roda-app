import { Magic } from '@magic-sdk/react-native-expo';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY;
export const isMagicEnabled = Boolean(PUBLISHABLE_KEY);

let client: Magic | null = null;

export function getMagic(): Magic {
  if (!PUBLISHABLE_KEY) {
    throw new Error('Magic is not configured — set EXPO_PUBLIC_MAGIC_PUBLISHABLE_KEY.');
  }
  if (!client) client = new Magic(PUBLISHABLE_KEY);
  return client;
}

export async function loginWithMagicEmail(email: string): Promise<void> {
  await getMagic().auth.loginWithEmailOTP({ email: email.trim(), showUI: true });
}
