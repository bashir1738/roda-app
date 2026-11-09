#!/usr/bin/env node
/**
 * Upgrade the live Roda contract or Roda Token contract bytecode on NEAR.
 *
 * Usage:
 *   # Upgrade main Roda contract
 *   node scripts/upgrade.js --contract roda [--wasm target/wasm32-unknown-unknown/release/roda.wasm] [--migrate true]
 *
 *   # Upgrade Roda NEP-141 token contract
 *   node scripts/upgrade.js --contract token [--wasm token/target/wasm32-unknown-unknown/release/roda_token.wasm]
 *
 * Flags:
 *   --contract <roda|token>   Which contract to upgrade (default: roda)
 *   --wasm <path>             Path to compiled .wasm binary
 *   --target <account>        Contract account ID (overrides testnet-state.json / .env)
 *   --admin <account>         Admin account ID (overrides testnet-state.json / .env)
 *   --migrate <true|false>    Trigger state migration callback (default: true)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { connect, keyStores } = require('near-api-js');

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

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
      out[key] = val;
      if (val !== 'true') i++;
    }
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const statePath = path.join(__dirname, 'testnet-state.json');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};

  const network = env.NEAR_NETWORK || state.network || 'testnet';
  const nodeUrl = env.NEAR_NODE_URL || 'https://rpc.testnet.fastnear.com';
  const targetType = (args.contract || 'roda').toLowerCase();
  const migrate = (args.migrate || 'true').toLowerCase() === 'true';

  let targetAccount;
  let defaultWasmPath;

  if (targetType === 'token') {
    targetAccount = args.target || env.NEAR_TOKEN_ACCOUNT_ID || state.token;
    defaultWasmPath = path.join(
      __dirname,
      '..',
      'token',
      'target',
      'wasm32-unknown-unknown',
      'release',
      'roda_token.wasm'
    );
  } else {
    targetAccount = args.target || env.NEAR_RODA_ACCOUNT_ID || state.roda;
    defaultWasmPath = path.join(
      __dirname,
      '..',
      'target',
      'wasm32-unknown-unknown',
      'release',
      'roda.wasm'
    );
  }

  const adminAccount = args.admin || env.NEAR_ADMIN_ACCOUNT_ID || state.admin;
  const wasmPath = path.resolve(args.wasm || defaultWasmPath);

  if (!targetAccount) {
    console.error(`Error: target contract account for '${targetType}' not found.`);
    console.error('Pass --target <account> or configure .env / scripts/testnet-state.json');
    process.exit(1);
  }

  if (!adminAccount) {
    console.error('Error: admin account not found. Pass --admin <account> or configure NEAR_ADMIN_ACCOUNT_ID');
    process.exit(1);
  }

  if (!fs.existsSync(wasmPath)) {
    console.error(`Error: WASM file not found at: ${wasmPath}`);
    console.error('Run `npm run build` in program/ first, or pass --wasm <path>');
    process.exit(1);
  }

  const wasmBytes = fs.readFileSync(wasmPath);
  // Verify WebAssembly magic header "\0asm" (0x00, 0x61, 0x73, 0x6d)
  if (
    wasmBytes.length < 4 ||
    wasmBytes[0] !== 0x00 ||
    wasmBytes[1] !== 0x61 ||
    wasmBytes[2] !== 0x73 ||
    wasmBytes[3] !== 0x6d
  ) {
    console.error('Error: File is not a valid WebAssembly binary (missing \\0asm magic header)');
    process.exit(1);
  }

  const sizeKb = (wasmBytes.length / 1024).toFixed(1);
  console.log(`=== Upgrading ${targetType.toUpperCase()} Contract ===`);
  console.log(`Target:      ${targetAccount}`);
  console.log(`Admin:       ${adminAccount}`);
  console.log(`WASM File:   ${wasmPath} (${sizeKb} KB)`);
  console.log(`Migrate:     ${migrate}`);
  console.log(`Network:     ${network} (${nodeUrl})`);

  const memStore = new keyStores.InMemoryKeyStore();
  const fsStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(require('os').homedir(), '.near-credentials')
  );
  if (env.NEAR_PRIVATE_KEY) {
    const { KeyPair } = require('near-api-js');
    await memStore.setKey(network, adminAccount, KeyPair.fromString(env.NEAR_PRIVATE_KEY));
  }
  const keyStore = new keyStores.MergeKeyStore([memStore, fsStore]);
  const near = await connect({ networkId: network, nodeUrl, keyStore });
  const admin = await near.account(adminAccount);

  const base64Code = wasmBytes.toString('base64');

  console.log('\nSending upgrade transaction with 300 TGas...');
  const outcome = await admin.functionCall({
    contractId: targetAccount,
    methodName: 'upgrade',
    args: {
      code: base64Code,
      migrate,
    },
    gas: '300000000000000', // 300 TGas (max allowable gas for contract deploy + migrate callback)
    attachedDeposit: '0',
  });

  const txHash = outcome.transaction?.hash || outcome.transaction_outcome?.id || 'unknown';
  console.log(`\nUpgrade completed successfully!`);
  console.log(`Transaction Hash: ${txHash}`);

  // Verification step
  console.log('\nVerifying post-upgrade status...');
  try {
    const targetObj = await near.account(targetAccount);
    if (targetType === 'roda') {
      const config = await targetObj.viewFunction({
        contractId: targetAccount,
        methodName: 'get_config',
        args: {},
      });
      console.log('Contract view verification: get_config() succeeded:');
      console.log(`  Admin:         ${config.admin}`);
      console.log(`  Token:         ${config.token_id}`);
      console.log(`  Vaults Count:  ${config.vault_count}`);
      console.log(`  Circles Count: ${config.circle_count}`);
    } else {
      const metadata = await targetObj.viewFunction({
        contractId: targetAccount,
        methodName: 'ft_metadata',
        args: {},
      });
      console.log('Contract view verification: ft_metadata() succeeded:');
      console.log(`  Name:     ${metadata.name}`);
      console.log(`  Symbol:   ${metadata.symbol}`);
      console.log(`  Decimals: ${metadata.decimals}`);
    }
  } catch (err) {
    console.warn('Post-upgrade verification warning:', err.message);
  }
}

main().catch((err) => {
  console.error('\nUpgrade failed with error:');
  console.error(err);
  process.exit(1);
});
