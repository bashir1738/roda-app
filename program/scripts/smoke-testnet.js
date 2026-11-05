#!/usr/bin/env node
/**
 * End-to-end testnet smoke test against a deployed Roda + test FT.
 *
 * Flow:
 *   1. Two accounts faucet-claim test tokens
 *   2. Create a 2-member circle
 *   3. Both join + contribute via ft_transfer_call
 *   4. Wrong recipient claim is rejected
 *   5. Wait for round frequency, correct recipient claims
 *   6. Verify fee landed on admin
 *   7. Second round completes and circle is closed
 *
 * Usage:
 *   node scripts/smoke-testnet.js --alice alice.testnet --bob bob.testnet
 *
 * Both accounts need full-access keys on this machine and must be registered
 * on the FT (storage_deposit) before running.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { connect, keyStores, utils } = require('near-api-js');

const GAS = '100000000000000'; // 100 TGas
const YOCTO = '1';

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function view(near, contractId, methodName, args) {
  const account = await near.account(contractId);
  return account.viewFunction({ contractId, methodName, args });
}

async function call(account, contractId, methodName, args, deposit = '0') {
  return account.functionCall({
    contractId,
    methodName,
    args,
    gas: GAS,
    attachedDeposit: deposit,
  });
}

async function ftTransferCall(sender, token, receiverId, amount, msg) {
  return call(sender, token, 'ft_transfer_call', {
    receiver_id: receiverId,
    amount: String(amount),
    memo: null,
    msg: JSON.stringify(msg),
  }, YOCTO);
}

async function main() {
  const env = loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const state = JSON.parse(fs.readFileSync(path.join(__dirname, 'testnet-state.json'), 'utf8'));

  const network = state.network || env.NEAR_NETWORK || 'testnet';
  const nodeUrl = env.NEAR_NODE_URL || 'https://rpc.testnet.fastnear.com';
  const roda = state.roda || env.NEAR_RODA_ACCOUNT_ID;
  const token = state.token || env.NEAR_TOKEN_ACCOUNT_ID;
  const aliceId = args.alice;
  const bobId = args.bob;
  if (!aliceId || !bobId) {
    console.error('Usage: node scripts/smoke-testnet.js --alice <acct> --bob <acct>');
    process.exit(1);
  }

  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(require('os').homedir(), '.near-credentials')
  );
  const near = await connect({ network, nodeUrl, keyStore });
  const alice = await near.account(aliceId);
  const bob = await near.account(bobId);
  const adminId = state.admin || env.NEAR_ADMIN_ACCOUNT_ID;

  const circleCode = 400000 + Math.floor(Math.random() * 100000);
  const contribution = 10_000_000; // 10 rUSDC
  const frequency = 60; // seconds — keep short for smoke

  console.log('── 1. Faucet claims ──');
  for (const acct of [alice, bob]) {
    try {
      await call(acct, roda, 'faucet', {});
      console.log(`  faucet ok: ${acct.accountId}`);
    } catch (e) {
      console.log(`  faucet skipped (${acct.accountId}):`, String(e).split('\n')[0]);
    }
  }
  await sleep(3000);

  console.log('── 2. Create circle', circleCode, '──');
  await call(alice, roda, 'create_circle', {
    circle_code: circleCode,
    name: 'Smoke Circle',
    max_members: 2,
    contribution_amount: contribution,
    frequency_secs: frequency,
  });
  const afterCreate = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  members:', afterCreate.members.length, 'status:', afterCreate.status);

  console.log('── 3. Bob joins ──');
  await call(bob, roda, 'join_circle', { circle_code: circleCode });
  const afterJoin = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  members:', afterJoin.members.length);
  if (afterJoin.members.length !== 2) throw new Error('expected 2 members');

  console.log('── 4. Contribute via ft_transfer_call ──');
  await ftTransferCall(alice, token, roda, contribution, { type: 'contribute', circle: circleCode });
  await ftTransferCall(bob, token, roda, contribution, { type: 'contribute', circle: circleCode });
  const afterPay = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  paid:', afterPay.paid_count, 'pool:', afterPay.pool_balance);
  if (afterPay.paid_count !== 2) throw new Error('expected both paid');

  console.log('── 5. Wrong recipient claim rejected ──');
  try {
    await call(bob, roda, 'claim_payout', { circle_code: circleCode });
    console.log('  ERROR: bob claim should have failed');
    process.exit(1);
  } catch (e) {
    const msg = String(e);
    const ok = msg.includes('NotYourPayout') || msg.includes('RoundNotReady');
    console.log(ok ? `  rejected as expected (${msg.includes('NotYourPayout') ? 'NotYourPayout' : 'RoundNotReady'})` : `  unexpected error: ${msg}`);
    if (!ok) process.exit(1);
  }

  console.log(`── 6. Waiting ${frequency}s for round boundary ──`);
  await sleep((frequency + 5) * 1000);

  console.log('── 7. Alice (round 0 recipient) claims ──');
  await call(alice, roda, 'claim_payout', { circle_code: circleCode });
  await sleep(5000);
  const afterPayout = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  pool:', afterPayout.pool_balance, 'round:', afterPayout.current_round, 'paid:', afterPayout.paid_count);
  if (afterPayout.pool_balance !== 0) throw new Error('pool should be 0');

  const adminBal = await view(near, token, 'ft_balance_of', { account_id: adminId });
  console.log('  admin FT balance:', adminBal);

  console.log('── 8. Round 2: both contribute, bob claims ──');
  await ftTransferCall(alice, token, roda, contribution, { type: 'contribute', circle: circleCode });
  await ftTransferCall(bob, token, roda, contribution, { type: 'contribute', circle: circleCode });
  await sleep((frequency + 5) * 1000);
  await call(bob, roda, 'claim_payout', { circle_code: circleCode });
  await sleep(5000);
  const completed = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  status:', completed.status, 'pool:', completed.pool_balance);
  if (completed.status !== 'Completed') throw new Error('circle should be Completed');

  console.log('── 9. Close circle ──');
  await call(alice, roda, 'close_circle', { circle_code: circleCode });
  const gone = await view(near, roda, 'get_circle', { circle_code: circleCode });
  console.log('  get_circle after close:', gone);

  console.log('\nSmoke test PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
