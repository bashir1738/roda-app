import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { setNearKey } from '../lib/near';
import {
  clearWallet,
  deviceAccountId,
  getOrCreateWalletForEmail,
  getStoredEmail,
  getStoredWalletKind,
  loadWallet,
  saveActiveAddress,
  saveEmail,
  saveWalletKind,
  type NearWallet,
} from '../lib/wallet';
import { getMagic, isMagicEnabled, loginWithMagicEmail } from '../lib/magic';
import {
  connectExternalNearWallet,
  disconnectExternalNearWallet,
  type NearWalletProvider,
} from '../lib/nearWalletConnect';
import { createRecoveryCode, verifyRecoveryCode } from '../lib/magicRecovery';
import { CLUSTER } from '../constants/roda';

const WALLET_INACTIVITY_MS = 15 * 60 * 1000;
export type TxState = 'idle' | 'signing' | 'confirming' | 'success' | 'error';
export type WalletKind = 'magic' | 'meteor' | 'device';

interface WalletContextValue {
  address?: string;
  publicKey?: string;
  wallet?: NearWallet;
  walletKind?: WalletKind;
  email?: string;
  isConnected: boolean;
  cluster: string;
  connect: () => void;
  connectNearWallet: (provider?: NearWalletProvider) => Promise<void>;
  connectMwa: () => Promise<void>;
  disconnect: (preserveEmail?: boolean) => Promise<void>;
  isReady: boolean;
  isAuthenticated: boolean;
  isWalletReady: boolean;
  loginWithEmail: (email: string) => Promise<void>;
  backupCode?: string;
  verifyBackupCode: (code: string) => Promise<boolean>;
  createDeviceWallet: () => Promise<void>;
  isLoggingIn: boolean;
  loginVisible: boolean;
  closeLogin: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  isConnected: false,
  cluster: CLUSTER,
  connect: () => {},
  connectNearWallet: async () => {},
  connectMwa: async () => {},
  disconnect: async () => {},
  isReady: false,
  isAuthenticated: false,
  isWalletReady: false,
  loginWithEmail: async () => {},
  createDeviceWallet: async () => {},
  verifyBackupCode: async () => false,
  isLoggingIn: false,
  loginVisible: false,
  closeLogin: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<NearWallet>();
  const [walletKind, setWalletKind] = useState<WalletKind>();
  const [email, setEmail] = useState<string>();
  const [isReady, setIsReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [backupCode, setBackupCode] = useState<string>();
  const [pendingEmailWallet, setPendingEmailWallet] = useState<NearWallet>();
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    loadWallet()
      .then(async (restored) => {
        if (restored) {
          if (restored.keyPair) {
            await setNearKey(restored.accountId, restored.keyPair);
          }
          const savedKind = (await getStoredWalletKind()) as WalletKind | null;
          const savedEmail = await getStoredEmail();
          setWallet(restored);
          setWalletKind(savedKind ?? (savedEmail ? 'magic' : 'device'));
          setEmail(savedEmail ?? undefined);
        }
        setIsReady(true);
      })
      .catch(() => setIsReady(true));
  }, []);

  const activate = useCallback(async (next: NearWallet, kind: WalletKind) => {
    if (next.keyPair) await setNearKey(next.accountId, next.keyPair);
    await saveActiveAddress(next.accountId);
    await saveWalletKind(kind);
    setWallet(next);
    setWalletKind(kind);
  }, []);

  const createDeviceWallet = useCallback(async () => {
    const key = await (await import('../lib/nearKey')).createNearKey();
    const accountId = await deviceAccountId(key);
    await activate({ accountId, keyPair: key }, 'device');
  }, [activate]);

  const loginWithEmail = useCallback(
    async (typedEmail: string) => {
      let emailToUse = typedEmail.trim().toLowerCase();
      setIsLoggingIn(true);
      try {
        if (isMagicEnabled) {
          await loginWithMagicEmail(emailToUse);
          try {
            const meta = await getMagic().user.getInfo();
            if (meta?.email) {
              emailToUse = meta.email.trim().toLowerCase();
            }
          } catch (e) {
            console.warn('Could not retrieve Magic user metadata:', e);
          }
        } else {
          console.warn(
            'Magic publishable key not configured — using deterministic local NEAR key.',
          );
        }

        const next = await getOrCreateWalletForEmail(emailToUse);
        await activate(next, 'magic');
        setEmail(emailToUse);
        await saveEmail(emailToUse);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [activate],
  );

  const finishMagicLogin = useCallback(
    async (code: string) => {
      if (!pendingEmailWallet || !(await verifyRecoveryCode(code))) return false;
      await activate(pendingEmailWallet, 'magic');
      setPendingEmailWallet(undefined);
      setBackupCode(undefined);
      setLoginVisible(false);
      return true;
    },
    [activate, pendingEmailWallet],
  );

  const connectExternal = useCallback(
    async (provider: NearWalletProvider = 'meteor') => {
      const connected = await connectExternalNearWallet(provider);
      await activate(
        { accountId: connected.accountId, keyPair: connected.keyPair },
        'meteor',
      );
      setLoginVisible(false);
    },
    [activate],
  );

  const disconnect = useCallback(
    async (preserveEmail = false) => {
      if (walletKind === 'magic' && isMagicEnabled) {
        try {
          await getMagic().user.logout();
        } catch (e) {
          console.warn('Magic logout error:', e);
        }
      }
      if (walletKind === 'meteor') {
        try {
          await disconnectExternalNearWallet();
        } catch (e) {
          console.warn('Meteor disconnect error:', e);
        }
      }
      await clearWallet(preserveEmail);
      setWallet(undefined);
      setWalletKind(undefined);
      if (!preserveEmail) setEmail(undefined);
    },
    [walletKind],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') backgroundedAt.current = Date.now();
      if (
        state === 'active' &&
        backgroundedAt.current &&
        Date.now() - backgroundedAt.current > WALLET_INACTIVITY_MS
      ) {
        disconnect(true)
          .then(() => setLoginVisible(true))
          .catch(() => {});
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [disconnect]);

  const address = wallet?.accountId;
  return (
    <WalletContext.Provider
      value={{
        address,
        publicKey: address,
        wallet,
        walletKind,
        email,
        isConnected: !!wallet,
        cluster: CLUSTER,
        connect: () => setLoginVisible(true),
        connectNearWallet: connectExternal,
        connectMwa: () => connectExternal('meteor'),
        disconnect,
        isReady,
        isAuthenticated: !!wallet,
        isWalletReady: !!wallet && !!address,
        loginWithEmail,
        createDeviceWallet,
        isLoggingIn,
        loginVisible,
        backupCode,
        verifyBackupCode: finishMagicLogin,
        closeLogin: () => setLoginVisible(false),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
