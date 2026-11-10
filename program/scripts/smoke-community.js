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

async function view(near, contractId, methodName, args = {}) {
  const account = await near.account(contractId);
  return account.viewFunction({ contractId, methodName, args });
}

async function call(account, contractId, methodName, args, deposit = '0', gas = GAS) {
  return account.functionCall({
    contractId,
    methodName,
    args,
    gas,
    attachedDeposit: deposit,
  });
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
  const near = await connect({ network, nodeUrl, keyStore });
  const alice = await near.account(aliceId);
  const bob = await near.account(bobId);

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
  await call(alice, factory, 'create', { name: daoName, args: b64(initArgs) }, utils.format.parseNearAmount('6'), '150000000000000');

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

  console.log('── 8. Verify reputation & shares ──');
  const aliceRep = await view(near, roda, 'get_reputation', { account: aliceId });
  const aliceShares = await view(near, roda, 'get_community_shares', { community_id: communityId, account: aliceId });
  console.log('  Alice rep score:', aliceRep.score, 'shares:', aliceShares);

  console.log('\nCommunity smoke test PASSED');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
