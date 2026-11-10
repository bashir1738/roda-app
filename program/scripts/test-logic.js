#!/usr/bin/env node
/**
 * Pure-logic tests mirroring the Rust unit tests (no network, no cargo).
 * Run: node scripts/test-logic.js
 */
'use strict';

const assert = require('assert');

const FEE_NUMERATOR = 3;
const FEE_DENOMINATOR = 1000;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const CIRCLE_CODE_MIN = 100000;
const CIRCLE_CODE_MAX = 999999;

function roundEndTs(roundStartedTs, frequencySecs) {
  return roundStartedTs + frequencySecs;
}

function roundReady(roundStartedTs, frequencySecs, now) {
  return now >= roundEndTs(roundStartedTs, frequencySecs);
}

function feeOf(amount) {
  return Math.floor((amount * FEE_NUMERATOR) / FEE_DENOMINATOR);
}

function validName(n) {
  return (
    n.length >= USERNAME_MIN &&
    n.length <= USERNAME_MAX &&
    /^[a-z0-9_]+$/.test(n)
  );
}

function tierRules(tier) {
  const table = {
    0: { min: 0, lock: 0 },
    1: { min: 10_000_000, lock: 7 * 24 * 60 * 60 },
    2: { min: 50_000_000, lock: 30 * 24 * 60 * 60 },
    3: { min: 100_000_000, lock: 182 * 24 * 60 * 60 },
    4: { min: 250_000_000, lock: 365 * 24 * 60 * 60 },
  };
  return table[tier];
}

// ── payout timing ─────────────────────────────────────────────────────────────
assert.strictEqual(roundReady(1000, 60, 1059), false, 'reject premature payout');
assert.strictEqual(roundReady(1000, 60, 1060), true, 'allow payout at boundary');

// ── fee math ──────────────────────────────────────────────────────────────────
assert.strictEqual(feeOf(20_000_000), 60_000, '0.3% of 20 USDC');
assert.strictEqual(20_000_000 - feeOf(20_000_000), 19_940_000, 'payout after fee');
assert.strictEqual(feeOf(100), 0, 'tiny pool fee rounds down');

// ── name rules ────────────────────────────────────────────────────────────────
assert.ok(validName('alice'));
assert.ok(validName('a_1'));
assert.ok(!validName('ab'));
assert.ok(!validName('Alice'));
assert.ok(!validName('alice!'));
assert.ok(!validName('x'.repeat(21)));

// ── tier minimums / locks ─────────────────────────────────────────────────────
assert.strictEqual(tierRules(0).min, 0);
assert.strictEqual(tierRules(0).lock, 0);
assert.strictEqual(tierRules(1).min, 10_000_000);
assert.strictEqual(tierRules(1).lock, 604800);
assert.strictEqual(tierRules(2).lock, 2592000);
assert.strictEqual(tierRules(4).min, 250_000_000);

// ── circle code bounds ────────────────────────────────────────────────────────
assert.ok(CIRCLE_CODE_MIN === 100000 && CIRCLE_CODE_MAX === 999999);

// ── rotation: 2 members, rounds 0 and 1 ───────────────────────────────────────
function recipientIndex(members, round) {
  return round % members.length;
}
const members = ['alice.testnet', 'bob.testnet'];
assert.strictEqual(members[recipientIndex(members, 0)], 'alice.testnet');
assert.strictEqual(members[recipientIndex(members, 1)], 'bob.testnet');

// ── deposit message shapes match contract ─────────────────────────────────────
const depositMsg = JSON.stringify({ type: 'deposit', vault_id: 0 });
const contributeMsg = JSON.stringify({ type: 'contribute', circle: 400000 });
assert.deepStrictEqual(JSON.parse(depositMsg), { type: 'deposit', vault_id: 0 });
assert.deepStrictEqual(JSON.parse(contributeMsg), { type: 'contribute', circle: 400000 });

// ── activity cap keeps last 50 ────────────────────────────────────────────────
function pushActivity(items, item, max = 50) {
  const next = [...items, item];
  while (next.length > max) next.shift();
  return next;
}
let activity = [];
for (let i = 0; i < 60; i++) activity = pushActivity(activity, { i });
assert.strictEqual(activity.length, 50);
assert.strictEqual(activity[0].i, 10);
assert.strictEqual(activity[49].i, 59);

// ── community envelope allocation & spend math (Phase 1) ──────────────────────
function applyBudgetDeposit(community, envelopeId, amount) {
  if (!community.linked || community.dissolved) throw new Error('CommunityUnavailable');
  if (envelopeId === null || envelopeId === undefined) {
    community.pool_unallocated += amount;
  } else {
    const env = community.envelopes.find((e) => e.id === envelopeId);
    if (!env || !env.active) throw new Error('EnvelopeInactive');
    env.allocated += amount;
  }
  community.total_shares += amount;
}

function allocateEnvelope(community, envelopeId, amount) {
  if (community.pool_unallocated < amount) throw new Error('InsufficientPool');
  const env = community.envelopes.find((e) => e.id === envelopeId);
  if (!env || !env.active) throw new Error('EnvelopeInactive');
  community.pool_unallocated -= amount;
  env.allocated += amount;
}

function spendEnvelope(community, envelopeId, amount) {
  const env = community.envelopes.find((e) => e.id === envelopeId);
  if (!env || !env.active) throw new Error('EnvelopeInactive');
  const remaining = env.allocated - env.spent;
  if (remaining < amount) throw new Error('ExceedsEnvelope');
  env.spent += amount;
}

const comm = {
  linked: true,
  dissolved: false,
  pool_unallocated: 0,
  total_shares: 0,
  envelopes: [
    { id: 0, name: 'Grants', allocated: 0, spent: 0, active: true },
    { id: 1, name: 'Events', allocated: 0, spent: 0, active: true },
  ],
};
applyBudgetDeposit(comm, null, 100_000_000); // 100 USDC to pool
assert.strictEqual(comm.pool_unallocated, 100_000_000);
assert.strictEqual(comm.total_shares, 100_000_000);
allocateEnvelope(comm, 0, 60_000_000);
assert.strictEqual(comm.pool_unallocated, 40_000_000);
assert.strictEqual(comm.envelopes[0].allocated, 60_000_000);
spendEnvelope(comm, 0, 25_000_000);
assert.strictEqual(comm.envelopes[0].allocated - comm.envelopes[0].spent, 35_000_000);
assert.throws(() => spendEnvelope(comm, 0, 36_000_000), /ExceedsEnvelope/);

const budgetDepositMsgPool = JSON.stringify({ type: 'budget_deposit', community: 0, envelope: null });
const budgetDepositMsgEnv = JSON.stringify({ type: 'budget_deposit', community: 0, envelope: 1 });
assert.deepStrictEqual(JSON.parse(budgetDepositMsgPool), { type: 'budget_deposit', community: 0, envelope: null });
assert.deepStrictEqual(JSON.parse(budgetDepositMsgEnv), { type: 'budget_deposit', community: 0, envelope: 1 });

// ── reputation scoring math (Phase 2) ─────────────────────────────────────────
function computeReputation(rep) {
  const reliabilityRaw = Math.min(rep.contributions_ok * 25, 350);
  const penaltyPts = rep.contributions_missed * 40;
  const reliabilityPts = Math.max(0, reliabilityRaw - penaltyPts);
  const completionPts = Math.min(rep.circles_completed * 50, 250);
  const vaultPts = Math.min(rep.vault_withdraw_units * 15, 150);
  const volumePts = Math.min(Math.floor(rep.community_volume / 10_000_000) * 5, 150);
  const tenurePts = Math.min(Math.floor(rep.tenure_days / 3), 100);
  return Math.min(1000, reliabilityPts + completionPts + vaultPts + volumePts + tenurePts);
}

assert.strictEqual(
  computeReputation({ contributions_ok: 0, contributions_missed: 0, circles_completed: 0, vault_withdraw_units: 0, community_volume: 0, tenure_days: 0 }),
  0,
  'fresh account earns zero Sybil points',
);
assert.strictEqual(
  computeReputation({ contributions_ok: 4, contributions_missed: 1, circles_completed: 2, vault_withdraw_units: 2, community_volume: 40_000_000, tenure_days: 30 }),
  220,
);

// ── collective ownership pro-rata surplus math (Phase 4) ──────────────────────
function computeSurplusPayout(surplus, userShares, totalShares) {
  if (!surplus || !userShares || !totalShares) return 0;
  return Number((BigInt(surplus) * BigInt(userShares)) / BigInt(totalShares));
}
assert.strictEqual(computeSurplusPayout(150_000_000, 200_000_000, 300_000_000), 100_000_000);
assert.strictEqual(computeSurplusPayout(150_000_000, 100_000_000, 300_000_000), 50_000_000);

console.log('All logic tests passed.');
