/**
 * Deprecated alias for backwards compatibility.
 * Use lib/nearWalletConnect.ts for external NEAR wallet connections.
 */
import {
  connectExternalNearWallet,
  disconnectExternalNearWallet,
} from './nearWalletConnect';

export async function connectMeteor() {
  const result = await connectExternalNearWallet('meteor');
  return { accountId: result.accountId };
}

export async function disconnectMeteor() {
  await disconnectExternalNearWallet();
}
