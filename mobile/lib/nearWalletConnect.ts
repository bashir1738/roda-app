import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyPair } from 'near-api-js';
import { CONTRACT_ID, NEAR_NETWORK } from '../constants/roda';
import { setNearKey } from './near';
import { saveActiveAddress } from './wallet';

export type NearWalletProvider = 'mynearwallet' | 'meteor' | 'here';
export type ExternalKeyScope = 'contract' | 'full';

const KEY_SCOPE_STORAGE = '@roda/external_key_scope';

export interface ConnectedNearWallet {
  accountId: string;
  publicKey: string;
  keyPair: KeyPair;
  provider: NearWalletProvider;
  scope: ExternalKeyScope;
}

export async function getExternalKeyScope(): Promise<ExternalKeyScope | null> {
  const val = await AsyncStorage.getItem(KEY_SCOPE_STORAGE).catch(() => null);
  return val === 'full' || val === 'contract' ? val : null;
}

export async function saveExternalKeyScope(scope: ExternalKeyScope): Promise<void> {
  await AsyncStorage.setItem(KEY_SCOPE_STORAGE, scope).catch(() => {});
}

export async function clearExternalKeyScope(): Promise<void> {
  await AsyncStorage.removeItem(KEY_SCOPE_STORAGE).catch(() => {});
}

/**
 * Connects to an external NEAR wallet (MyNearWallet, Meteor, or HERE) via
 * standard web auth session or in-app provider.
 *
 * NOTE: Sputnik DAO creation/voting and FT `ft_transfer_call` target contracts
 * other than Roda (`sputnikv2.testnet`, `<dao>.*`, `FT_ID`), so `scope: 'full'`
 * requests multi-contract access by omitting `contract_id` on login.
 */
export async function connectExternalNearWallet(
  provider: NearWalletProvider = 'mynearwallet',
  options?: { scope?: ExternalKeyScope },
): Promise<ConnectedNearWallet> {
  const scope: ExternalKeyScope = options?.scope ?? 'full';

  // Check if an injected bridge exists (e.g. Meteor in-app dApp browser)
  if (provider === 'meteor' && typeof globalThis !== 'undefined') {
    const meteor = (globalThis as typeof globalThis & {
      meteor?: { connect: () => Promise<{ accountId: string }> };
    }).meteor;
    if (meteor) {
      const connected = await meteor.connect();
      await saveExternalKeyScope('full');
      return {
        accountId: connected.accountId,
        publicKey: '',
        keyPair: KeyPair.fromRandom('ed25519'),
        provider: 'meteor',
        scope: 'full',
      };
    }
  }

  // 1. Generate an Ed25519 keypair for this session
  const keyPair = KeyPair.fromRandom('ed25519');
  const publicKey = keyPair.getPublicKey().toString();

  // 2. Setup redirect URL: roda://wallet-callback
  const redirectUrl = Linking.createURL('wallet-callback');

  // 3. Determine base URL based on provider & network
  let baseUrl: string;
  if (provider === 'meteor') {
    baseUrl = 'https://wallet.meteorwallet.app/login/';
  } else if (provider === 'here') {
    baseUrl = 'https://web.herewallet.app/login/';
  } else {
    baseUrl =
      NEAR_NETWORK === 'mainnet'
        ? 'https://app.mynearwallet.com/login/'
        : 'https://testnet.mynearwallet.com/login/';
  }

  // 4. Construct NEAR web login URL (`contract_id` omitted when `scope === 'full'`
  // so the user grants a key authorized for Sputnik DAO + USDC FT + Roda calls).
  const queryRecord: Record<string, string> = {
    title: 'Roda',
    public_key: publicKey,
    success_url: redirectUrl,
    failure_url: redirectUrl,
  };
  if (scope === 'contract') {
    queryRecord.contract_id = CONTRACT_ID;
  }
  const params = new URLSearchParams(queryRecord);

  const fullUrl = `${baseUrl}?${params.toString()}`;

  // 5. Open in-app browser session
  const result = await WebBrowser.openAuthSessionAsync(fullUrl, redirectUrl);

  if (result.type !== 'success' || !result.url) {
    throw new Error('Wallet connection cancelled or closed.');
  }

  // 6. Extract account_id from callback url
  const callbackUrl = new URL(result.url);
  const accountId =
    callbackUrl.searchParams.get('account_id') ||
    callbackUrl.searchParams.get('accountId');

  if (!accountId) {
    const error =
      callbackUrl.searchParams.get('error') || 'No account returned by wallet.';
    throw new Error(`Wallet connection failed: ${error}`);
  }

  // 7. Associate the keypair & scope with this accountId
  await setNearKey(accountId, keyPair);
  await saveActiveAddress(accountId);
  await saveExternalKeyScope(scope);

  return {
    accountId,
    publicKey,
    keyPair,
    provider,
    scope,
  };
}

export async function disconnectExternalNearWallet(): Promise<void> {
  await clearExternalKeyScope();
  // If injected meteor exists, clean up
  if (typeof globalThis !== 'undefined') {
    const meteor = (globalThis as typeof globalThis & {
      meteor?: { disconnect?: () => Promise<void> };
    }).meteor;
    if (meteor?.disconnect) {
      await meteor.disconnect().catch(() => {});
    }
  }
}

