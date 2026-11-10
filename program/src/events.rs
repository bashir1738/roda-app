use near_sdk::{env, serde_json, AccountId};

/// Emit a NEP-297 standard event (`EVENT_JSON:` log line).
fn emit(event: &str, data: serde_json::Value) {
    let payload = serde_json::json!({
        "standard": "roda",
        "version": "0.1.0",
        "event": event,
        "data": data,
    });
    env::log_str(&format!("EVENT_JSON:{}", payload));
}

pub fn vault_created(owner: &AccountId, vault_id: u64, tier: u8) {
    emit(
        "VaultCreated",
        serde_json::json!({ "owner": owner, "vault_id": vault_id, "tier": tier }),
    );
}

pub fn vault_deposit(owner: &AccountId, vault_id: u64, amount: u64, balance: u64, maturity_ts: i64) {
    emit(
        "VaultDeposit",
        serde_json::json!({
            "owner": owner, "vault_id": vault_id, "amount": amount,
            "balance": balance, "maturity_ts": maturity_ts,
        }),
    );
}

pub fn vault_withdraw(owner: &AccountId, vault_id: u64, amount: u64, balance: u64) {
    emit(
        "VaultWithdraw",
        serde_json::json!({
            "owner": owner, "vault_id": vault_id, "amount": amount, "balance": balance,
        }),
    );
}

pub fn vault_closed(owner: &AccountId, vault_id: u64) {
    emit(
        "VaultClosed",
        serde_json::json!({ "owner": owner, "vault_id": vault_id }),
    );
}

pub fn circle_created(
    circle_id: u64,
    creator: &AccountId,
    name: &str,
    max_members: u8,
    contribution_amount: u64,
    frequency_secs: u64,
) {
    emit(
        "CircleCreated",
        serde_json::json!({
            "circle_id": circle_id, "creator": creator, "name": name,
            "max_members": max_members, "contribution_amount": contribution_amount,
            "frequency_secs": frequency_secs,
        }),
    );
}

pub fn member_joined(circle_id: u64, member: &AccountId, member_count: u8) {
    emit(
        "MemberJoined",
        serde_json::json!({
            "circle_id": circle_id, "member": member, "member_count": member_count,
        }),
    );
}

pub fn contribution_made(
    circle_id: u64,
    member: &AccountId,
    round: u16,
    amount: u64,
    paid_count: u8,
) {
    emit(
        "ContributionMade",
        serde_json::json!({
            "circle_id": circle_id, "member": member, "round": round,
            "amount": amount, "paid_count": paid_count,
        }),
    );
}

pub fn payout_released(
    circle_id: u64,
    recipient: &AccountId,
    round: u16,
    amount: u64,
    next_round: u16,
    completed: bool,
) {
    emit(
        "PayoutReleased",
        serde_json::json!({
            "circle_id": circle_id, "recipient": recipient, "round": round,
            "amount": amount, "next_round": next_round, "completed": completed,
        }),
    );
}

pub fn circle_closed(circle_id: u64, by: &AccountId) {
    emit(
        "CircleClosed",
        serde_json::json!({ "circle_id": circle_id, "by": by }),
    );
}

pub fn name_claimed(owner: &AccountId, name: &str) {
    emit(
        "NameClaimed",
        serde_json::json!({ "owner": owner, "name": name }),
    );
}

pub fn name_released(owner: &AccountId, name: &str) {
    emit(
        "NameReleased",
        serde_json::json!({ "owner": owner, "name": name }),
    );
}

pub fn faucet_claimed(user: &AccountId, amount: u64) {
    emit(
        "FaucetClaimed",
        serde_json::json!({ "user": user, "amount": amount }),
    );
}

pub fn contract_upgraded() {
    emit(
        "ContractUpgraded",
        serde_json::json!({ "ts": (env::block_timestamp() / 1_000_000_000) as i64 }),
    );
}

pub fn contract_migrated() {
    emit(
        "ContractMigrated",
        serde_json::json!({ "ts": (env::block_timestamp() / 1_000_000_000) as i64 }),
    );
}

pub fn admin_transferred(old_admin: &AccountId, new_admin: &AccountId) {
    emit(
        "AdminTransferred",
        serde_json::json!({ "old_admin": old_admin, "new_admin": new_admin }),
    );
}

// ─── Phase 1: Community Coordination & Budgets ────────────────────────────────

pub fn community_create(
    community_id: u64,
    dao_id: &AccountId,
    creator: &AccountId,
    name: &str,
    envelope_count: usize,
) {
    emit(
        "community_create",
        serde_json::json!({
            "community_id": community_id,
            "dao_id": dao_id,
            "creator": creator,
            "name": name,
            "envelope_count": envelope_count,
        }),
    );
}

pub fn community_link(community_id: u64, dao_id: &AccountId) {
    emit(
        "community_link",
        serde_json::json!({
            "community_id": community_id,
            "dao_id": dao_id,
        }),
    );
}

pub fn budget_deposit(
    community_id: u64,
    envelope_id: Option<u64>,
    sender: &AccountId,
    amount: u64,
) {
    emit(
        "budget_deposit",
        serde_json::json!({
            "community_id": community_id,
            "envelope_id": envelope_id,
            "sender": sender,
            "amount": amount,
        }),
    );
}

pub fn envelope_allocate(
    community_id: u64,
    envelope_id: u64,
    amount: u64,
    allocated: u64,
    pool_unallocated: u64,
) {
    emit(
        "envelope_allocate",
        serde_json::json!({
            "community_id": community_id,
            "envelope_id": envelope_id,
            "amount": amount,
            "allocated": allocated,
            "pool_unallocated": pool_unallocated,
        }),
    );
}

pub fn envelope_spend(
    community_id: u64,
    envelope_id: u64,
    recipient: &AccountId,
    amount: u64,
    spent: u64,
    remaining: u64,
) {
    emit(
        "envelope_spend",
        serde_json::json!({
            "community_id": community_id,
            "envelope_id": envelope_id,
            "recipient": recipient,
            "amount": amount,
            "spent": spent,
            "remaining": remaining,
        }),
    );
}

pub fn envelope_updated(community_id: u64, envelope_id: u64, name: &str, active: bool) {
    emit(
        "envelope_updated",
        serde_json::json!({
            "community_id": community_id,
            "envelope_id": envelope_id,
            "name": name,
            "active": active,
        }),
    );
}

// ─── Phase 2: Reputation ──────────────────────────────────────────────────────

pub fn reputation_updated(account: &AccountId, score: u32) {
    emit(
        "reputation_updated",
        serde_json::json!({
            "account": account,
            "score": score,
        }),
    );
}

// ─── Phase 3: Programmable Rewards ────────────────────────────────────────────

pub fn reward_rule_created(
    rule_id: u64,
    community_id: u64,
    source_envelope: u64,
    circle_code: Option<u64>,
    amount: u64,
) {
    emit(
        "reward_rule_created",
        serde_json::json!({
            "rule_id": rule_id,
            "community_id": community_id,
            "source_envelope": source_envelope,
            "circle_code": circle_code,
            "amount": amount,
        }),
    );
}

pub fn reward_rule_toggled(rule_id: u64, community_id: u64, active: bool) {
    emit(
        "reward_rule_toggled",
        serde_json::json!({
            "rule_id": rule_id,
            "community_id": community_id,
            "active": active,
        }),
    );
}

pub fn reward_paid(
    rule_id: u64,
    community_id: u64,
    envelope_id: u64,
    recipient: &AccountId,
    amount: u64,
) {
    emit(
        "reward_paid",
        serde_json::json!({
            "rule_id": rule_id,
            "community_id": community_id,
            "envelope_id": envelope_id,
            "recipient": recipient,
            "amount": amount,
        }),
    );
}

// ─── Phase 4: Collective Ownership ────────────────────────────────────────────

pub fn shares_minted(
    community_id: u64,
    account: &AccountId,
    amount: u64,
    balance: u64,
    total_shares: u64,
) {
    emit(
        "shares_minted",
        serde_json::json!({
            "community_id": community_id,
            "account": account,
            "amount": amount,
            "balance": balance,
            "total_shares": total_shares,
        }),
    );
}

pub fn shares_granted(
    community_id: u64,
    account: &AccountId,
    amount: u64,
    balance: u64,
    total_shares: u64,
) {
    emit(
        "shares_granted",
        serde_json::json!({
            "community_id": community_id,
            "account": account,
            "amount": amount,
            "balance": balance,
            "total_shares": total_shares,
        }),
    );
}

pub fn community_dissolved(
    community_id: u64,
    dao_id: &AccountId,
    dissolve_surplus: u64,
    total_shares: u64,
) {
    emit(
        "community_dissolved",
        serde_json::json!({
            "community_id": community_id,
            "dao_id": dao_id,
            "dissolve_surplus": dissolve_surplus,
            "total_shares": total_shares,
        }),
    );
}

pub fn surplus_claimed(community_id: u64, account: &AccountId, amount: u64, shares: u64) {
    emit(
        "surplus_claimed",
        serde_json::json!({
            "community_id": community_id,
            "account": account,
            "amount": amount,
            "shares": shares,
        }),
    );
}

