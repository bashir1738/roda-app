#!/usr/bin/env node
/**
 * Automated deployment of Roda Contracts to NEAR Testnet using a master private key.
 * Creates subaccounts, deploys bytecode, initializes state, registers storage, and outputs status.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { connect, keyStores, KeyPair, utils, Account } = require('near-api-js');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  }
  return env;
}

const env = loadEnv();
const PRIVATE_KEY = env.NEAR_PRIVATE_KEY || process.env.NEAR_PRIVATE_KEY;
const NETWORK = env.NEAR_NETWORK || 'testnet';
const NODE_URL = env.NEAR_NODE_URL || 'https://rpc.testnet.fastnear.com';

const ADMIN_ID = env.NEAR_ADMIN_ACCOUNT_ID || 'dev-92ebb0b3c42c.testnet';
const RODA_ID = env.NEAR_RODA_ACCOUNT_ID || `roda.${ADMIN_ID}`;
const TOKEN_ID = env.NEAR_TOKEN_ACCOUNT_ID || `usdc.${ADMIN_ID}`;

async function main() {
  if (!PRIVATE_KEY) {
    console.error('Error: NEAR_PRIVATE_KEY is required in program/.env or environment.');
    process.exit(1);
  }

  console.log('=== Deploying Roda Protocol to NEAR Testnet ===\n');

  const keyPair = KeyPair.fromString(PRIVATE_KEY);
  const pubKey = keyPair.getPublicKey();
  console.log('Admin Account:  ', ADMIN_ID);
  console.log('Public Key:     ', pubKey.toString());
  console.log('Roda Contract:  ', RODA_ID);
  console.log('Token Contract: ', TOKEN_ID);
  console.log('Node URL:       ', NODE_URL);

  // 1. Setup local ~/.near-credentials
  const credDir = path.join(os.homedir(), '.near-credentials', NETWORK);
  fs.mkdirSync(credDir, { recursive: true });
  for (const acc of [ADMIN_ID, RODA_ID, TOKEN_ID]) {
    const credPath = path.join(credDir, `${acc}.json`);
    fs.writeFileSync(
      credPath,
      JSON.stringify(
        {
          account_id: acc,
          public_key: pubKey.toString(),
          private_key: PRIVATE_KEY,
        },
        null,
        2
      )
    );
  }
  console.log('\n[1/7] Saved account credentials to ~/.near-credentials/testnet/');

  const keyStore = new keyStores.InMemoryKeyStore();
  await keyStore.setKey(NETWORK, ADMIN_ID, keyPair);
  await keyStore.setKey(NETWORK, RODA_ID, keyPair);
  await keyStore.setKey(NETWORK, TOKEN_ID, keyPair);

  const near = await connect({ networkId: NETWORK, nodeUrl: NODE_URL, keyStore });
  const adminAccount = await near.account(ADMIN_ID);

  const adminBalance = await adminAccount.getAccountBalance();
  console.log(`\n[2/7] Admin balance: ${utils.format.formatNearAmount(adminBalance.available)} NEAR`);

  // 2. Create subaccounts if they don't already exist
  async function ensureSubaccount(subId, depositNear) {
    try {
      const acc = await near.account(subId);
      const state = await acc.state();
      console.log(`  Subaccount ${subId} already exists (storage: ${state.storage_usage} bytes)`);
      return acc;
    } catch (e) {
      if (e.type === 'AccountDoesNotExist' || String(e).includes("doesn't exist") || String(e).includes('does not exist')) {
        console.log(`  Creating subaccount ${subId} with ${depositNear} NEAR...`);
        const depositYocto = utils.format.parseNearAmount(depositNear);
        await adminAccount.createAccount(subId, pubKey, depositYocto);
        console.log(`  Created ${subId} successfully!`);
        return await near.account(subId);
      }
      throw e;
    }
  }

  console.log('\n[3/7] Ensuring subaccounts exist...');
  const tokenAccount = await ensureSubaccount(TOKEN_ID, '3.0');
  const rodaAccount = await ensureSubaccount(RODA_ID, '3.8');

  // 3. Load WASM binaries
  const rodaWasmPath = path.join(__dirname, '..', 'target', 'wasm32-unknown-unknown', 'release', 'roda.wasm');
  const tokenWasmPath = path.join(__dirname, '..', 'token', 'target', 'wasm32-unknown-unknown', 'release', 'roda_token.wasm');

  if (!fs.existsSync(rodaWasmPath) || !fs.existsSync(tokenWasmPath)) {
    throw new Error('Compiled WASM files missing. Run npm run build first.');
  }

  const rodaWasm = fs.readFileSync(rodaWasmPath);
  const tokenWasm = fs.readFileSync(tokenWasmPath);
  console.log(`\n[4/7] Loaded WASM binaries:`);
  console.log(`  roda.wasm:       ${(rodaWasm.length / 1024).toFixed(1)} KB`);
  console.log(`  roda_token.wasm: ${(tokenWasm.length / 1024).toFixed(1)} KB`);

  // 4. Deploy and initialize Token Contract
  console.log(`\n[5/7] Deploying and initializing Token contract (${TOKEN_ID})...`);
  const tokenState = await tokenAccount.state();
  if (tokenState.code_hash === '11111111111111111111111111111111') {
    console.log('  Deploying code to token account...');
    await tokenAccount.deployContract(tokenWasm);
    console.log('  Initializing token with owner and protocol...');
    await tokenAccount.functionCall({
      contractId: TOKEN_ID,
      methodName: 'new',
      args: {
        owner: ADMIN_ID,
        protocol: RODA_ID,
        decimals: 6,
      },
      gas: '30000000000000',
      attachedDeposit: '0',
    });
    console.log('  Token contract initialized!');
  } else {
    console.log('  Token contract already has code deployed.');
    try {
      await tokenAccount.functionCall({
        contractId: TOKEN_ID,
        methodName: 'new',
        args: { owner: ADMIN_ID, protocol: RODA_ID, decimals: 6 },
        gas: '30000000000000',
        attachedDeposit: '0',
      });
    } catch (err) {
      if (String(err).includes('AlreadyInitialized')) {
        console.log('  Token already initialized.');
      } else {
        throw err;
      }
    }
  }

  // 5. Deploy and initialize Roda Contract
  console.log(`\n[6/7] Deploying and initializing Roda contract (${RODA_ID})...`);
  const rodaState = await rodaAccount.state();
  if (rodaState.code_hash === '11111111111111111111111111111111') {
    console.log('  Deploying code to roda account...');
    await rodaAccount.deployContract(rodaWasm);
    console.log('  Initializing roda contract...');
    await rodaAccount.functionCall({
      contractId: RODA_ID,
      methodName: 'new',
      args: {
        admin: ADMIN_ID,
        token_id: TOKEN_ID,
        faucet_enabled: true,
      },
      gas: '30000000000000',
      attachedDeposit: '0',
    });
    console.log('  Roda contract initialized!');
  } else {
    console.log('  Roda contract already has code deployed.');
    try {
      await rodaAccount.functionCall({
        contractId: RODA_ID,
        methodName: 'new',
        args: { admin: ADMIN_ID, token_id: TOKEN_ID, faucet_enabled: true },
        gas: '30000000000000',
        attachedDeposit: '0',
      });
    } catch (err) {
      if (String(err).includes('AlreadyInitialized')) {
        console.log('  Roda already initialized.');
      } else {
        throw err;
      }
    }
  }

  // 6. NEP-145 storage registration for Roda contract & Admin
  console.log(`\n[7/7] Registering NEP-145 storage deposits for FT transfers...`);
  const bounds = await tokenAccount.viewFunction({
    contractId: TOKEN_ID,
    methodName: 'storage_balance_bounds',
    args: {},
  });
  const minDeposit = bounds.min || utils.format.parseNearAmount('0.00125');

  for (const acc of [RODA_ID, ADMIN_ID]) {
    try {
      const bal = await tokenAccount.viewFunction({
        contractId: TOKEN_ID,
        methodName: 'storage_balance_of',
        args: { account_id: acc },
      });
      if (!bal || !bal.total) {
        console.log(`  Registering ${acc} on ${TOKEN_ID} with ${minDeposit} yoctoNEAR...`);
        await adminAccount.functionCall({
          contractId: TOKEN_ID,
          methodName: 'storage_deposit',
          args: { account_id: acc, registration_only: true },
          gas: '30000000000000',
          attachedDeposit: minDeposit.toString(),
        });
      } else {
        console.log(`  ${acc} is already registered on token contract.`);
      }
    } catch (err) {
      console.warn(`  Warning registering storage for ${acc}:`, err.message);
    }
  }

  // 7. Verify post-deployment views
  console.log('\n=== Verifying Deployed Contracts ===');
  const rodaConfig = await rodaAccount.viewFunction({
    contractId: RODA_ID,
    methodName: 'get_config',
    args: {},
  });
  console.log('Roda Contract Config:');
  console.log(`  Admin:          ${rodaConfig.admin}`);
  console.log(`  Token:          ${rodaConfig.token_id}`);
  console.log(`  Faucet Enabled: ${rodaConfig.faucet_enabled}`);
  console.log(`  Vault Count:    ${rodaConfig.vault_count}`);
  console.log(`  Circle Count:   ${rodaConfig.circle_count}`);

  const tokenMeta = await tokenAccount.viewFunction({
    contractId: TOKEN_ID,
    methodName: 'ft_metadata',
    args: {},
  });
  console.log('\nToken Contract Metadata:');
  console.log(`  Name:     ${tokenMeta.name}`);
  console.log(`  Symbol:   ${tokenMeta.symbol}`);
  console.log(`  Decimals: ${tokenMeta.decimals}`);

  // 8. Update state file
  const testnetState = {
    network: NETWORK,
    admin: ADMIN_ID,
    roda: RODA_ID,
    token: TOKEN_ID,
    decimals: 6,
    faucetEnabled: true,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(__dirname, 'testnet-state.json'),
    JSON.stringify(testnetState, null, 2) + '\n'
  );
  console.log('\nUpdated program/scripts/testnet-state.json');

  console.log('\n🎉 ALL CONTRACTS SUCCESSFULLY DEPLOYED AND INITIALIZED ON TESTNET!');
  return testnetState;
}

main().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
