import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { KeyPair } from 'near-api-js';
import { CONTRACT_ID, NEAR_NETWORK } from '../constants/roda';
import { setNearKey } from './near';
import { saveActiveAddress } from './wallet';

export type NearWalletProvider = 'mynearwallet' | 'meteor' | 'here';

export interface ConnectedNearWallet {
  accountId: string;
  publicKey: string;
  keyPair: KeyPair;
  provider: NearWalletProvider;
}

/**
 * Connects to an external NEAR wallet (MyNearWallet, Meteor, or HERE) via
 * standard web auth session or in-app provider.
 */
export async function connectExternalNearWallet(
  provider: NearWalletProvider = 'mynearwallet'
): Promise<ConnectedNearWallet> {
  // Check if an injected bridge exists (e.g. Meteor in-app dApp browser)
  if (provider === 'meteor' && typeof globalThis !== 'undefined') {
    const meteor = (globalThis as typeof globalThis & {
      meteor?: { connect: () => Promise<{ accountId: string }> };
    }).meteor;
    if (meteor) {
      const connected = await meteor.connect();
      return {
        accountId: connected.accountId,
        publicKey: '',
        keyPair: KeyPair.fromRandom('ed25519'),
        provider: 'meteor',
      };
    }
  }

  // 1. Generate an Ed25519 keypair for this session/contract access
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
    // Default to MyNearWallet
    baseUrl =
      NEAR_NETWORK === 'mainnet'
        ? 'https://app.mynearwallet.com/login/'
        : 'https://testnet.mynearwallet.com/login/';
  }

  // 4. Construct standard NEAR web login URL with contract access
  const params = new URLSearchParams({
    title: 'Roda',
    contract_id: CONTRACT_ID,
    public_key: publicKey,
    success_url: redirectUrl,
    failure_url: redirectUrl,
  });

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

  // 7. Associate the keypair with this accountId
  await setNearKey(accountId, keyPair);
  await saveActiveAddress(accountId);

  return {
    accountId,
    publicKey,
    keyPair,
    provider,
  };
}

export async function disconnectExternalNearWallet(): Promise<void> {
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

