#!/usr/bin/env node
/**
 * Deploy + initialize Roda contracts on testnet.
 *
 * Prerequisites:
 *   1. `npm run build` (produces wasm under target/wasm32-unknown-unknown/release/)
 *   2. Full-access keys for admin + both contract accounts in
 *      ~/.near-credentials/testnet/
 *   3. `.env` configured from `.env.example`
 *
 * This script does NOT create accounts — use `near create-account` first.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { connect, keyStores, utils } = require('near-api-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('Missing program/.env — copy .env.example and fill it in.');
    process.exit(1);
  }
  const env = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const network = env.NEAR_NETWORK || 'testnet';
  const nodeUrl = env.NEAR_NODE_URL || 'https://rpc.testnet.near.org';
  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(require('os').homedir(), '.near-credentials')
  );

  const near = await connect({ network, nodeUrl, keyStore });
  const admin = await near.account(env.NEAR_ADMIN_ACCOUNT_ID);
  const rodaAccount = await near.account(env.NEAR_RODA_ACCOUNT_ID);
  const tokenAccount = await near.account(env.NEAR_TOKEN_ACCOUNT_ID);

  const rodaWasm = fs.readFileSync(path.resolve(__dirname, '..', env.NEAR_RODA_WASM || 'target/wasm32-unknown-unknown/release/roda.wasm'));
  const tokenWasm = fs.readFileSync(path.resolve(__dirname, '..', env.NEAR_TOKEN_WASM || 'target/wasm32-unknown-unknown/release/roda_token.wasm'));

  const decimals = Number(env.NEAR_TOKEN_DECIMALS || 6);
  const faucetEnabled = (env.NEAR_FAUCET_ENABLED || 'true').toLowerCase() === 'true';

  console.log('Deploying token wasm →', env.NEAR_TOKEN_ACCOUNT_ID);
  await tokenAccount.deployContract(tokenWasm);

  console.log('Deploying roda wasm →', env.NEAR_RODA_ACCOUNT_ID);
  await rodaAccount.deployContract(rodaWasm);

  console.log('Initializing token…');
  try {
    await tokenAccount.functionCall({
      contractId: env.NEAR_TOKEN_ACCOUNT_ID,
      methodName: 'new',
      args: {
        owner: env.NEAR_ADMIN_ACCOUNT_ID,
        protocol: env.NEAR_RODA_ACCOUNT_ID,
        decimals,
      },
      gas: '30000000000000',
      attachedDeposit: '0',
    });
  } catch (e) {
    if (String(e).includes('AlreadyInitialized')) console.log('  token already initialized');
    else throw e;
  }

  console.log('Initializing Roda…');
  try {
    await rodaAccount.functionCall({
      contractId: env.NEAR_RODA_ACCOUNT_ID,
      methodName: 'new',
      args: {
        admin: env.NEAR_ADMIN_ACCOUNT_ID,
        token_id: env.NEAR_TOKEN_ACCOUNT_ID,
        faucet_enabled: faucetEnabled,
      },
      gas: '30000000000000',
      attachedDeposit: '0',
    });
  } catch (e) {
    if (String(e).includes('AlreadyInitialized')) console.log('  roda already initialized');
    else throw e;
  }

  // NEP-145: register accounts that will hold / settle FT.
  const minStorage = await tokenAccount.viewFunction({
    contractId: env.NEAR_TOKEN_ACCOUNT_ID,
    methodName: 'storage_balance_bounds',
    args: {},
  });
  const deposit = minStorage.min || '0';
  const toRegister = [env.NEAR_ADMIN_ACCOUNT_ID, env.NEAR_RODA_ACCOUNT_ID];
  for (const account of toRegister) {
    console.log(`storage_deposit → ${account}`);
    try {
      await admin.functionCall({
        contractId: env.NEAR_TOKEN_ACCOUNT_ID,
        methodName: 'storage_deposit',
        args: { account_id: account, registration_only: true },
        gas: '30000000000000',
        attachedDeposit: deposit,
      });
    } catch (e) {
      if (String(e).includes('already registered')) console.log('  already registered');
      else throw e;
    }
  }

  const state = {
    network,
    admin: env.NEAR_ADMIN_ACCOUNT_ID,
    roda: env.NEAR_RODA_ACCOUNT_ID,
    token: env.NEAR_TOKEN_ACCOUNT_ID,
    decimals,
    faucetEnabled,
    updatedAt: new Date().toISOString(),
  };
  const out = path.join(__dirname, 'testnet-state.json');
  fs.writeFileSync(out, JSON.stringify(state, null, 2) + '\n');
  console.log('Wrote', out);
  console.log('Done. Contracts are live on', network);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
