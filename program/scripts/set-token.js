#!/usr/bin/env node
/**
 * Point the live Roda contract at a different NEP-141 token and toggle the faucet.
 *
 * Usage:
 *   node scripts/set-token.js --token <account> [--faucet true|false]
 *
 * Reads program/.env + scripts/testnet-state.json for defaults.
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
      out[argv[i].slice(2)] = argv[i + 1];
      i++;
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
  const nodeUrl = env.NEAR_NODE_URL || 'https://rpc.testnet.near.org';
  const roda = args.roda || env.NEAR_RODA_ACCOUNT_ID || state.roda;
  const token = args.token || env.NEAR_TOKEN_ACCOUNT_ID || state.token;
  const faucet = (args.faucet || env.NEAR_FAUCET_ENABLED || 'true').toLowerCase() === 'true';

  if (!roda || !token) {
    console.error('Need --roda and --token (or configure .env / testnet-state.json)');
    process.exit(1);
  }

  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(require('os').homedir(), '.near-credentials')
  );
  const near = await connect({ network, nodeUrl, keyStore });
  const admin = await near.account(env.NEAR_ADMIN_ACCOUNT_ID || state.admin);

  console.log(`set_token(token_id=${token}, faucet_enabled=${faucet}) → ${roda}`);
  const result = await admin.functionCall({
    contractId: roda,
    methodName: 'set_token',
    args: { token_id: token, faucet_enabled: faucet },
    gas: '30000000000000',
    attachedDeposit: '0',
  });
  console.log('tx:', result.transaction?.hash || result);

  if (fs.existsSync(statePath)) {
    state.token = token;
    state.faucetEnabled = faucet;
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
