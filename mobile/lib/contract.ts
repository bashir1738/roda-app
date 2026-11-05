import { Account, type Near } from 'near-api-js';
import { Buffer } from 'buffer';

import { CONTRACT_ID, FT_ID } from '../constants/roda';
import { getNear } from './near';

export type NearView = Record<string, unknown> | unknown[] | string | number | null;

type ViewQueryResult = {
  block_height: number;
  block_hash: string;
  result: number[];
  logs: string[];
};

export async function viewContract<T>(
  methodName: string,
  args: Record<string, unknown> = {},
  contractId: string = CONTRACT_ID,
): Promise<T> {
  const connection = (await getNear()).connection;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`viewContract timeout: ${methodName}`)), 6000),
  );
  const queryPromise = connection.provider.query<ViewQueryResult>({
    request_type: 'call_function',
    account_id: contractId,
    method_name: methodName,
    args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    finality: 'final',
  });
  const result = await Promise.race([queryPromise, timeoutPromise]);
  const bytes = Uint8Array.from(result.result);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function viewToken<T>(
  methodName: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return viewContract<T>(methodName, args, FT_ID);
}

export async function getNearAccount(accountId: string): Promise<Account> {
  const near: Near = await getNear();
  return await near.account(accountId);
}

export async function callContract(
  accountId: string,
  methodName: string,
  args: Record<string, unknown> = {},
  gas = '100000000000000',
  attachedDeposit = '0',
): Promise<string> {
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: CONTRACT_ID,
    methodName,
    args,
    gas: BigInt(gas),
    attachedDeposit: BigInt(attachedDeposit),
  });
  return result.transaction.hash;
}

export async function transferToken(
  accountId: string,
  receiverId: string,
  amount: string,
  msg?: string,
): Promise<string> {
  const account = await getNearAccount(accountId);
  const result = await account.functionCall({
    contractId: FT_ID,
    methodName: msg ? 'ft_transfer_call' : 'ft_transfer',
    args: msg
      ? { receiver_id: receiverId, amount, msg }
      : { receiver_id: receiverId, amount, memo: null },
    gas: BigInt('100000000000000'),
    attachedDeposit: 1n,
  });
  return result.transaction.hash;
}

export async function transferNear(
  accountId: string,
  receiverId: string,
  amount: string,
): Promise<string> {
  const account = await getNearAccount(accountId);
  const result = await account.sendMoney(receiverId, BigInt(amount));
  return result.transaction.hash;
}
