/**
 * Meteor is the only external wallet bridge in this pass. The SDK supplies
 * the account and transaction signer when its native bridge is available.
 */
export interface MeteorWallet {
  accountId: string;
  signAndSendTransaction: (transaction: unknown) => Promise<{ hash: string }>;
}

let active: MeteorWallet | null = null;

export async function connectMeteor(): Promise<MeteorWallet> {
  const meteor = (globalThis as typeof globalThis & {
    meteor?: { connect: () => Promise<MeteorWallet> };
  }).meteor;
  if (!meteor) throw new Error('Meteor wallet is not available on this device.');
  active = await meteor.connect();
  return active;
}

export async function disconnectMeteor(): Promise<void> {
  active = null;
}
