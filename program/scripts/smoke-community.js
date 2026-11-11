#!/usr/bin/env node
/**
 * End-to-end smoke test script for the Community Coordination Layer (Phases 0-4):
 *   1. Stage DAO via Sputnik DAO factory (sputnikv2.testnet) with council members
 *   2. Register DAO on configured USDC NEP-141 token (storage_deposit)
 *   3. Stage community on Roda (linked = false)
 *   4. Submit + approve Sputnik FunctionCall proposal calling roda.confirm_link
 *   5. Budget deposit via ft_transfer_call (shares minted + reputation volume bumped)
 *   6. Council allocates from pool_unallocated -> envelope 0
 *   7. Council proposes & approves envelope spend -> recipient receives USDC
 *   8. Over-budget spend rejected
 *   9. Reward rule + dissolve / surplus verification
 *
 * Usage:
 *   node scripts/smoke-community.js --alice alice.testnet --bob bob.testnet
 *
 * NOTE: Not executed automatically in CI. Requires local ~/.near-credentials and testnet NEAR.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { connect, keyStores, utils } = require('near-api-js');

const GAS = '200000000000000'; // 200 TGas for cross-contract DAO execution
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

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeSuccessValue(outcome) {
  const b64Val = outcome?.status?.SuccessValue;
  if (!b64Val) return undefined;
  const raw = Buffer.from(b64Val, 'base64').toString('utf8');
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function waitUntil(fn, description, timeoutMs = 15000, intervalMs = 1200) {
  const deadline = Date.now() + timeoutMs;
  let lastVal;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      lastVal = await fn();
      if (lastVal) return lastVal;
    } catch (e) {
      lastErr = e;
    }
    await sleep(intervalMs);
  }
  if (lastErr) throw lastErr;
  throw new Error(`Timed out waiting for: ${description}`);
}

function isTransientRpcError(err) {
  const code = err?.code || err?.cause?.code || '';
  const msg = String(err?.message || err || '');
  if (/ExecutionError|ActionError|panicked|Unauthorized|NotFound|Already/i.test(msg)) {
    return false;
  }
  if (['ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'ECONNREFUSED', 'UND_ERR_SOCKET', 'UND_ERR_HEADERS_TIMEOUT'].includes(code)) {
    return true;
  }
  return /terminated|fetch failed|socket hang up|ECONNRESET|ETIMEDOUT|429|502|503|504/i.test(msg);
}

async function withRpcRetry(fn, retries = 4) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries || !isTransientRpcError(err)) throw err;
      await sleep(1500 * (i + 1));
    }
  }
  throw lastErr;
}

async function view(near, contractId, methodName, args = {}) {
  return withRpcRetry(async () => {
    const account = await near.account(contractId);
    return account.viewFunction({ contractId, methodName, args });
  });
}

async function call(account, contractId, methodName, args, deposit = '0', gas = GAS) {
  return withRpcRetry(
    () =>
      account.functionCall({
        contractId,
        methodName,
        args,
        gas,
        attachedDeposit: deposit,
      }),
    2
  );
}

async function main() {
  const env = loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const statePath = path.join(__dirname, 'testnet-state.json');
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : {};

  const network = state.network || env.NEAR_NETWORK || 'testnet';
  const nodeUrl = env.NEAR_NODE_URL || 'https://rpc.testnet.fastnear.com';
  const roda = state.roda || env.NEAR_RODA_ACCOUNT_ID;
  const token = state.token || env.NEAR_TOKEN_ACCOUNT_ID;
  const factory = env.SPUTNIK_FACTORY_ID || 'sputnikv2.testnet';

  const aliceId = args.alice;
  const bobId = args.bob;
  if (!aliceId || !bobId || !roda || !token) {
    console.error('Usage: node scripts/smoke-community.js --alice <acct> --bob <acct>');
    process.exit(1);
  }

  const keyStore = new keyStores.UnencryptedFileSystemKeyStore(
    path.join(require('os').homedir(), '.near-credentials')
  );
  const near = await connect({ networkId: network, nodeUrl, keyStore });
  const alice = await near.account(aliceId);
  const bob = await near.account(bobId);

  console.log('── 0. Ensure token registration & test USDC balance ──');
  for (const acct of [alice, bob]) {
    const sb = await view(near, token, 'storage_balance_of', { account_id: acct.accountId });
    if (!sb || !sb.total) {
      await call(acct, token, 'storage_deposit', { account_id: acct.accountId, registration_only: true }, '1250000000000000000000', '30000000000000');
      console.log(`  registered ${acct.accountId} on ${token}`);
    }
    const bal = BigInt(await view(near, token, 'ft_balance_of', { account_id: acct.accountId }));
    if (bal < 50_000_000n) {
      await call(acct, roda, 'faucet', {}, '0', GAS);
      console.log(`  faucet claimed for ${acct.accountId}`);
    }
  }

  const daoName = `roda-comm-${Date.now().toString(36)}`;
  const daoId = `${daoName}.${factory}`;
  const bond = '100000000000000000000000'; // 0.1 NEAR

  console.log('── 1. Create Sputnik DAO:', daoId, '──');
  const initArgs = {
    config: {
      name: daoName,
      purpose: 'Roda Community Coordination smoke test',
      metadata: '',
    },
    policy: {
      roles: [
        {
          name: 'council',
          kind: { Group: [aliceId, bobId] },
          permissions: ['*:*'],
          vote_policy: {},
        },
      ],
      default_vote_policy: {
        weight_kind: 'RoleWeight',
        quorum: '0',
        threshold: [1, 2],
      },
      proposal_bond: bond,
      proposal_period: '604800000000000',
      bounty_bond: bond,
      bounty_forgiveness_period: '86400000000000',
    },
  };
  await call(alice, factory, 'create', { name: daoName, args: b64(initArgs) }, utils.format.parseNearAmount('6'), '180000000000000');

  console.log('── 2. Stage Community on Roda ──');
  const createCommOutcome = await call(alice, roda, 'create_community', {
    dao_id: daoId,
    name: 'Smoke Community',
    envelopes: ['Grants', 'Operations'],
  });
  let communityId = decodeSuccessValue(createCommOutcome);
  if (typeof communityId !== 'number') {
    const userIds = await waitUntil(async () => {
      const ids = await view(near, roda, 'get_user_community_ids', { account: aliceId });
      return ids.length ? ids : null;
    }, 'staged community_id');
    communityId = userIds[userIds.length - 1];
  }
  console.log('  staged community_id:', communityId);

  async function submitAndPass(description, method_name, argsObj, gas = '50000000000000') {
    const propOutcome = await call(
      alice,
      daoId,
      'add_proposal',
      {
        proposal: {
          description,
          kind: {
            FunctionCall: {
              receiver_id: roda,
              actions: [
                {
                  method_name,
                  args: b64(argsObj),
                  deposit: '0',
                  gas,
                },
              ],
            },
          },
        },
      },
      bond
    );
    let propId = decodeSuccessValue(propOutcome);
    if (typeof propId !== 'number') {
      propId = (await view(near, daoId, 'get_last_proposal_id')) - 1;
    }
    await call(alice, daoId, 'act_proposal', { id: propId, action: 'VoteApprove' });
    await call(bob, daoId, 'act_proposal', { id: propId, action: 'VoteApprove' });
    return propId;
  }

  console.log('── 3. Propose & approve confirm_link via Sputnik ──');
  await submitAndPass(`Link Roda community #${communityId}`, 'confirm_link', { community_id: communityId });
  const linkedComm = await waitUntil(async () => {
    const c = await view(near, roda, 'get_community', { community_id: communityId });
    return c && c.linked ? c : null;
  }, 'community.linked === true');
  console.log('  linked verified:', linkedComm.linked);

  console.log('── 4. Budget deposit to unallocated pool (20 USDC) ──');
  await call(
    alice,
    token,
    'ft_transfer_call',
    {
      receiver_id: roda,
      amount: '20000000',
      memo: null,
      msg: JSON.stringify({ type: 'budget_deposit', community: communityId, envelope: null }),
    },
    YOCTO
  );
  await waitUntil(async () => {
    const c = await view(near, roda, 'get_community', { community_id: communityId });
    return c && c.pool_unallocated >= 20_000_000 ? c : null;
  }, 'pool_unallocated >= 20 USDC');

  console.log('── 5. Propose & approve allocate (15 USDC -> envelope 0) ──');
  await submitAndPass('Allocate 15 USDC to Grants', 'allocate', {
    community_id: communityId,
    envelope_id: 0,
    amount: 15_000_000,
  });
  await waitUntil(async () => {
    const c = await view(near, roda, 'get_community', { community_id: communityId });
    return c && c.envelopes?.[0]?.allocated >= 15_000_000 ? c : null;
  }, 'envelope 0 allocated');

  console.log('── 6. Propose & approve spend (10 USDC from envelope 0 -> Bob) ──');
  const bobBalBefore = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  await submitAndPass(
    'Pay Bob 10 USDC from Grants envelope',
    'community_spend',
    {
      community_id: communityId,
      envelope_id: 0,
      recipient: bobId,
      amount: 10_000_000,
    },
    '100000000000000'
  );

  const bobBalAfter = await waitUntil(async () => {
    const bal = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
    return bal - bobBalBefore === 10_000_000n ? bal : null;
  }, 'Bob USDC +10 USDC', 20000);
  console.log('  Bob USDC gained:', (bobBalAfter - bobBalBefore).toString());

  console.log('── 7. Direct non-DAO spend rejected ──');
  try {
    await call(alice, roda, 'community_spend', {
      community_id: communityId,
      envelope_id: 0,
      recipient: aliceId,
      amount: 1_000_000,
    });
    throw new Error('Direct spend should have failed');
  } catch (e) {
    if (!String(e).includes('Unauthorized')) throw e;
    console.log('  Direct spend rejected cleanly (Unauthorized)');
  }

  console.log('── 8. Over-budget spend rejected (10 USDC when 5 USDC remaining) ──');
  const bobBeforeOver = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  await submitAndPass(
    'Attempt over-budget spend of 10 USDC',
    'community_spend',
    {
      community_id: communityId,
      envelope_id: 0,
      recipient: bobId,
      amount: 10_000_000,
    },
    '100000000000000'
  );
  await sleep(3500);
  const bobAfterOver = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  const commAfterOver = await view(near, roda, 'get_community', { community_id: communityId });
  if (bobAfterOver !== bobBeforeOver || commAfterOver.envelopes[0].remaining !== 5_000_000) {
    throw new Error('Over-budget spend was not blocked!');
  }
  console.log('  Over-budget spend blocked (remaining still 5 USDC)');

  console.log('── 9. Phase 3: Create programmable reward rule via DAO ──');
  await submitAndPass('Add 1 USDC CircleRoundCompleted reward from Grants', 'create_reward_rule', {
    community_id: communityId,
    source_envelope: 0,
    circle_code: null,
    trigger: { kind: 'circle_round_completed' },
    amount: 1_000_000,
  });
  const rules = await waitUntil(async () => {
    const r = await view(near, roda, 'get_reward_rules', { community_id: communityId });
    return r.length >= 1 ? r : null;
  }, 'reward rule created');
  console.log('  Reward rule created, count:', rules.length);

  console.log('── 10. Phase 4: Verify reputation, shares, dissolve & claim surplus ──');
  const aliceRep = await view(near, roda, 'get_reputation', { account: aliceId });
  const aliceShares = await view(near, roda, 'get_community_shares', { community_id: communityId, account: aliceId });
  console.log('  Alice rep score:', aliceRep.score, 'shares:', aliceShares);

  // Grant 20M shares to Bob so Alice & Bob split remaining 10 USDC surplus 50/50
  await submitAndPass('Grant 20M shares to Bob', 'grant_shares', {
    community_id: communityId,
    recipient: bobId,
    amount: 20_000_000,
    min_reputation: null,
  });
  await waitUntil(async () => {
    const s = await view(near, roda, 'get_community_shares', { community_id: communityId, account: bobId });
    return s >= 20_000_000 ? s : null;
  }, 'Bob granted 20M shares');

  // Close envelopes 0 and 1, then dissolve community
  for (const eid of [0, 1]) {
    await submitAndPass(`Close envelope ${eid}`, 'set_envelope', {
      community_id: communityId,
      envelope_id: eid,
      name: null,
      active: false,
    });
    await waitUntil(async () => {
      const c = await view(near, roda, 'get_community', { community_id: communityId });
      return c && c.envelopes?.[eid] && !c.envelopes[eid].active ? true : null;
    }, `envelope ${eid} closed`);
  }

  await submitAndPass('Dissolve community & unlock pro-rata surplus', 'dissolve_community', {
    community_id: communityId,
  });
  await waitUntil(async () => {
    const c = await view(near, roda, 'get_community', { community_id: communityId });
    return c && c.dissolved ? c : null;
  }, 'community dissolved');

  const bobPreClaim = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  await call(alice, roda, 'claim_surplus', { community_id: communityId });
  await call(bob, roda, 'claim_surplus', { community_id: communityId });
  const bobPostClaim = await waitUntil(async () => {
    const bal = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
    return bal - bobPreClaim === 5_000_000n ? bal : null;
  }, 'Bob claimed 5 USDC surplus', 20000);
  const finalComm = await view(near, roda, 'get_community', { community_id: communityId });
  console.log('  Dissolved:', finalComm.dissolved, 'surplus claimed by Bob:', (bobPostClaim - bobPreClaim).toString());
  if (!finalComm.dissolved || bobPostClaim - bobPreClaim !== 5_000_000n) {
    throw new Error('Expected community dissolved and Bob to claim 5 USDC pro-rata surplus');
  }

  console.log('\nCommunity smoke test PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
