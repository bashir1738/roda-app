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
