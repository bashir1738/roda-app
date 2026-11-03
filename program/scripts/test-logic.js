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

console.log('All logic tests passed.');
