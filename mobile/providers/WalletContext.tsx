import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { setNearKey } from '../lib/near';
import { clearWallet, deviceAccountId, getStoredEmail, loadWallet, saveActiveAddress, saveEmail, type NearWallet } from '../lib/wallet';
import { getMagic, isMagicEnabled, loginWithMagicEmail } from '../lib/magic';
import { connectMeteor, disconnectMeteor } from '../lib/mwa';
import { createRecoveryCode, verifyRecoveryCode } from '../lib/magicRecovery';
import { CLUSTER } from '../constants/roda';

const WALLET_INACTIVITY_MS = 15 * 60 * 1000;
export type TxState = 'idle' | 'signing' | 'confirming' | 'success' | 'error';
export type WalletKind = 'device' | 'magic' | 'meteor';

interface WalletContextValue {
  address?: string;
  publicKey?: string;
  wallet?: NearWallet;
  walletKind?: WalletKind;
  email?: string;
  isConnected: boolean;
  cluster: string;
  connect: () => void;
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
  isConnected: false, cluster: CLUSTER, connect: () => {}, connectMwa: async () => {},
  disconnect: async () => {}, isReady: false, isAuthenticated: false, isWalletReady: false,
  loginWithEmail: async () => {}, createDeviceWallet: async () => {},
  verifyBackupCode: async () => false,
  isLoggingIn: false, loginVisible: false, closeLogin: () => {},
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
    loadWallet().then(async (restored) => {
      if (restored) {
        await setNearKey(restored.accountId, restored.keyPair!);
        setWallet(restored);
        setWalletKind('device');
        setEmail((await getStoredEmail()) ?? undefined);
      }
      setIsReady(true);
    }).catch(() => setIsReady(true));
  }, []);

  const activate = useCallback(async (next: NearWallet, kind: WalletKind) => {
    if (next.keyPair) await setNearKey(next.accountId, next.keyPair);
    await saveActiveAddress(next.accountId);
    setWallet(next);
    setWalletKind(kind);
  }, []);

  const createDeviceWallet = useCallback(async () => {
    const key = await (await import('../lib/nearKey')).createNearKey();
    const accountId = await deviceAccountId(key);
    await activate({ accountId, keyPair: key }, 'device');
  }, [activate]);

  const loginWithEmail = useCallback(async (typedEmail: string) => {
    if (!isMagicEnabled) throw new Error('Magic email login is not configured.');
    setIsLoggingIn(true);
    try {
      await loginWithMagicEmail(typedEmail);
      // Pattern A: Magic authenticates the email; the NEAR key remains local.
      const current = await loadWallet();
      const next = current ?? await (async () => {
        const key = await (await import('../lib/nearKey')).createNearKey();
        return { accountId: await deviceAccountId(key), keyPair: key };
      })();
      setPendingEmailWallet(next);
      setBackupCode(await createRecoveryCode());
      setEmail(typedEmail.trim());
      await saveEmail(typedEmail.trim());
    } finally {
      setIsLoggingIn(false);
    }
  }, [activate, createDeviceWallet]);

  const finishMagicLogin = useCallback(async (code: string) => {
    if (!pendingEmailWallet || !(await verifyRecoveryCode(code))) return false;
    await activate(pendingEmailWallet, 'magic');
    setPendingEmailWallet(undefined);
    setBackupCode(undefined);
    setLoginVisible(false);
    return true;
  }, [activate, pendingEmailWallet]);

  const loginWithMeteor = useCallback(async () => {
    const connected = await connectMeteor();
    await activate({ accountId: connected.accountId }, 'meteor');
    setLoginVisible(false);
  }, [activate]);

  const disconnect = useCallback(async (preserveEmail = false) => {
    if (walletKind === 'magic' && isMagicEnabled) await getMagic().user.logout();
    if (walletKind === 'meteor') await disconnectMeteor();
    await clearWallet(preserveEmail);
    setWallet(undefined);
    setWalletKind(undefined);
    if (!preserveEmail) setEmail(undefined);
  }, [walletKind]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current && Date.now() - backgroundedAt.current > WALLET_INACTIVITY_MS) {
        disconnect(true).then(() => setLoginVisible(true)).catch(() => {});
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, [disconnect]);

  const address = wallet?.accountId;
  return (
    <WalletContext.Provider value={{
      address, publicKey: address, wallet, walletKind, email, isConnected: !!wallet,
      cluster: CLUSTER, connect: () => setLoginVisible(true), connectMwa: loginWithMeteor,
      disconnect, isReady, isAuthenticated: !!wallet, isWalletReady: !!wallet && !!address,
      loginWithEmail, createDeviceWallet, isLoggingIn, loginVisible,
      backupCode, verifyBackupCode: finishMagicLogin,
      closeLogin: () => setLoginVisible(false),
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
