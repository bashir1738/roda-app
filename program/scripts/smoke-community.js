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
  await call(alice, roda, 'create_community', {
    dao_id: daoId,
    name: 'Smoke Community',
    envelopes: ['Grants', 'Operations'],
  });
  const userIds = await view(near, roda, 'get_user_community_ids', { account: aliceId });
  const communityId = userIds[userIds.length - 1];
  console.log('  staged community_id:', communityId);

  console.log('── 3. Propose & approve confirm_link via Sputnik ──');
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: `Link Roda community #${communityId}`,
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'confirm_link',
                args: b64({ community_id: communityId }),
                deposit: '0',
                gas: '50000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const propId = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: propId, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: propId, action: 'VoteApprove' });
  await sleep(3000);
  const linkedComm = await view(near, roda, 'get_community', { community_id: communityId });
  if (!linkedComm.linked) throw new Error('Expected community to be linked');
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

  console.log('── 5. Propose & approve allocate (15 USDC -> envelope 0) ──');
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Allocate 15 USDC to Grants',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'allocate',
                args: b64({ community_id: communityId, envelope_id: 0, amount: 15_000_000 }),
                deposit: '0',
                gas: '50000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const allocProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: allocProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: allocProp, action: 'VoteApprove' });
  await sleep(3000);

  console.log('── 6. Propose & approve spend (10 USDC from envelope 0 -> Bob) ──');
  const bobBalBefore = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Pay Bob 10 USDC from Grants envelope',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'community_spend',
                args: b64({
                  community_id: communityId,
                  envelope_id: 0,
                  recipient: bobId,
                  amount: 10_000_000,
                }),
                deposit: '0',
                gas: '100000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const spendProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: spendProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: spendProp, action: 'VoteApprove' });
  await sleep(4000);

  const bobBalAfter = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  console.log('  Bob USDC gained:', (bobBalAfter - bobBalBefore).toString());
  if (bobBalAfter - bobBalBefore !== 10_000_000n) {
    throw new Error('Expected Bob to receive 10 USDC');
  }

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
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Attempt over-budget spend of 10 USDC',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'community_spend',
                args: b64({
                  community_id: communityId,
                  envelope_id: 0,
                  recipient: bobId,
                  amount: 10_000_000,
                }),
                deposit: '0',
                gas: '100000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const overProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: overProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: overProp, action: 'VoteApprove' });
  await sleep(3000);
  const bobAfterOver = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  const commAfterOver = await view(near, roda, 'get_community', { community_id: communityId });
  if (bobAfterOver !== bobBeforeOver || commAfterOver.envelopes[0].remaining !== 5_000_000) {
    throw new Error('Over-budget spend was not blocked!');
  }
  console.log('  Over-budget spend blocked (remaining still 5 USDC)');

  console.log('── 9. Phase 3: Create programmable reward rule via DAO ──');
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Add 1 USDC CircleRoundCompleted reward from Grants',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'create_reward_rule',
                args: b64({
                  community_id: communityId,
                  source_envelope: 0,
                  circle_code: null,
                  trigger: { kind: 'circle_round_completed' },
                  amount: 1_000_000,
                }),
                deposit: '0',
                gas: '50000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const rewardProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: rewardProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: rewardProp, action: 'VoteApprove' });
  await sleep(3000);
  const rules = await view(near, roda, 'get_reward_rules', { community_id: communityId });
  if (rules.length < 1) throw new Error('Expected reward rule to be created');
  console.log('  Reward rule created, count:', rules.length);

  console.log('── 10. Phase 4: Verify reputation, shares, dissolve & claim surplus ──');
  const aliceRep = await view(near, roda, 'get_reputation', { account: aliceId });
  const aliceShares = await view(near, roda, 'get_community_shares', { community_id: communityId, account: aliceId });
  console.log('  Alice rep score:', aliceRep.score, 'shares:', aliceShares);

  // Grant 20M shares to Bob so Alice & Bob split remaining 10 USDC surplus 50/50
  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Grant 20M shares to Bob',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'grant_shares',
                args: b64({ community_id: communityId, recipient: bobId, amount: 20_000_000, min_reputation: null }),
                deposit: '0',
                gas: '50000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const grantProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: grantProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: grantProp, action: 'VoteApprove' });
  await sleep(2000);

  // Close envelopes 0 and 1, then dissolve community
  for (const eid of [0, 1]) {
    await call(
      alice,
      daoId,
      'add_proposal',
      {
        proposal: {
          description: `Close envelope ${eid}`,
          kind: {
            FunctionCall: {
              receiver_id: roda,
              actions: [
                {
                  method_name: 'set_envelope',
                  args: b64({ community_id: communityId, envelope_id: eid, name: null, active: false }),
                  deposit: '0',
                  gas: '50000000000000',
                },
              ],
            },
          },
        },
      },
      bond
    );
    const closeProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
    await call(alice, daoId, 'act_proposal', { id: closeProp, action: 'VoteApprove' });
    await call(bob, daoId, 'act_proposal', { id: closeProp, action: 'VoteApprove' });
    await sleep(2000);
  }

  await call(
    alice,
    daoId,
    'add_proposal',
    {
      proposal: {
        description: 'Dissolve community & unlock pro-rata surplus',
        kind: {
          FunctionCall: {
            receiver_id: roda,
            actions: [
              {
                method_name: 'dissolve_community',
                args: b64({ community_id: communityId }),
                deposit: '0',
                gas: '50000000000000',
              },
            ],
          },
        },
      },
    },
    bond
  );
  const dissProp = (await view(near, daoId, 'get_last_proposal_id')) - 1;
  await call(alice, daoId, 'act_proposal', { id: dissProp, action: 'VoteApprove' });
  await call(bob, daoId, 'act_proposal', { id: dissProp, action: 'VoteApprove' });
  await sleep(3000);

  const bobPreClaim = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
  await call(alice, roda, 'claim_surplus', { community_id: communityId });
  await call(bob, roda, 'claim_surplus', { community_id: communityId });
  await sleep(4000);
  const bobPostClaim = BigInt(await view(near, token, 'ft_balance_of', { account_id: bobId }));
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
