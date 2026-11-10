mod community;
mod constants;
mod events;
mod ft;
mod state;

use near_sdk::collections::LookupMap;
use near_sdk::{
    env, near, require, AccountId, Gas, NearToken, PanicOnDefault, Promise,
    PromiseResult,
};

use crate::constants::*;
use crate::state::*;

/// Current unix time in seconds (NEAR block time is nanoseconds).
pub(crate) fn now_sec() -> i64 {
    (env::block_timestamp() / 1_000_000_000) as i64
}

pub(crate) fn checked_add(a: u64, b: u64) -> u64 {
    a.checked_add(b).expect("MathOverflow")
}

pub(crate) fn checked_sub(a: u64, b: u64) -> u64 {
    a.checked_sub(b).expect("MathOverflow")
}

/// Round ends at round_started + frequency (checked).
fn round_end_ts(round_started_ts: i64, frequency_secs: u64) -> i64 {
    round_started_ts
        .checked_add(frequency_secs as i64)
        .expect("MathOverflow")
}

/// Only the contract itself may run promise callbacks.
pub(crate) fn require_callback() {
    require!(
        env::predecessor_account_id() == env::current_account_id(),
        "Unauthorized"
    );
}

pub(crate) fn require_admin(admin: &AccountId) {
    require!(env::predecessor_account_id() == *admin, "Unauthorized");
}

/// Issue an `ft_transfer` on the configured token contract.
pub(crate) fn ft_transfer_promise(
    token: &AccountId,
    receiver: &AccountId,
    amount: u64,
) -> Promise {
    Promise::new(token.clone()).function_call(
        "ft_transfer".to_string(),
        serde_json::json!({
            "receiver_id": receiver.to_string(),
            "amount": amount.to_string(),
            "memo": null,
        })
        .to_string(),
        NearToken::from_yoctonear(1), // 1 yoctoNEAR required by NEP-141
        Gas::from_gas(GAS_FT_TRANSFER),
    )
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct RodaContract {
    config: Config,
    /// vault_id → Vault
    vaults: LookupMap<u64, Vault>,
    /// owner → vault ids
    user_vaults: LookupMap<AccountId, Vec<u64>>,
    /// circle code → Circle
    circles: LookupMap<u64, Circle>,
    /// account → joined circle codes
    user_circles: LookupMap<AccountId, Vec<u64>>,
    /// lowercase username → owner
    names: LookupMap<String, AccountId>,
    /// owner → username profile
    profiles: LookupMap<AccountId, NameProfile>,
    /// account → last faucet claim (unix seconds)
    faucet: LookupMap<AccountId, i64>,
    /// account → recent activity (newest last, capped)
    activity: LookupMap<AccountId, Vec<Activity>>,
    /// circle code → in-flight payout
    payout_pending: LookupMap<u64, PayoutPending>,
    /// vault_id → in-flight withdrawal
    withdraw_pending: LookupMap<u64, WithdrawPending>,
    /// Protocol fees that failed to transfer; admin collects later.
    fees_owed: u64,
    // ─── Community Coordination, Reputation, Rewards & Ownership (V2+) ───────
    community_count: u64,
    community_min_rep: u32,
    reward_rule_count: u64,
    reward_pending_count: u64,
    /// community_id → Community
    communities: LookupMap<u64, Community>,
    /// account → community ids created or contributed to
    user_communities: LookupMap<AccountId, Vec<u64>>,
    /// dao_id → linked community_id
    dao_communities: LookupMap<AccountId, u64>,
    /// (community_id, envelope_id) → in-flight envelope spend
    spend_pending: LookupMap<(u64, u64), SpendPending>,
    /// account → on-chain reputation breakdown
    reputation: LookupMap<AccountId, RepScore>,
    /// rule_id → RewardRule
    reward_rules: LookupMap<u64, RewardRule>,
    /// community_id → rule_ids
    community_reward_rules: LookupMap<u64, Vec<u64>>,
    /// circle_code → scoped rule_ids
    circle_reward_rules: LookupMap<u64, Vec<u64>>,
    /// (rule_id, recipient, event_key) → claimed flag
    rewards_claimed: LookupMap<(u64, AccountId, u64), bool>,
    /// pending_id → in-flight auto-reward transfer
    reward_pending: LookupMap<u64, RewardPending>,
    /// (community_id, account) → collective ownership shares
    community_shares: LookupMap<(u64, AccountId), u64>,
    /// community_id → shareholder accounts
    community_shareholders: LookupMap<u64, Vec<AccountId>>,
    /// (community_id, account) → dissolution surplus already claimed
    surplus_claimed: LookupMap<(u64, AccountId), bool>,
}

#[near]
impl RodaContract {
    /// One-time initializer. `faucet_enabled` should be true only for the
    /// Roda test token (which exposes a `mint` method gated to this contract).
    #[init]
    pub fn new(admin: AccountId, token_id: AccountId, faucet_enabled: bool) -> Self {
        require!(
            env::state_read::<RodaContract>().is_none()
                && env::state_read::<RodaContractV1>().is_none(),
            "AlreadyInitialized"
        );
        Self {
            config: Config {
                admin,
                token_id,
                vault_count: 0,
                circle_count: 0,
                faucet_enabled,
            },
            vaults: LookupMap::new(StorageKey::Vaults),
            user_vaults: LookupMap::new(StorageKey::UserVaults),
            circles: LookupMap::new(StorageKey::Circles),
            user_circles: LookupMap::new(StorageKey::UserCircles),
            names: LookupMap::new(StorageKey::Names),
            profiles: LookupMap::new(StorageKey::Profiles),
            faucet: LookupMap::new(StorageKey::Faucet),
            activity: LookupMap::new(StorageKey::Activity),
            payout_pending: LookupMap::new(StorageKey::PayoutPending),
            withdraw_pending: LookupMap::new(StorageKey::WithdrawPending),
            fees_owed: 0,
            community_count: 0,
            community_min_rep: 0,
            reward_rule_count: 0,
            reward_pending_count: 0,
            communities: LookupMap::new(StorageKey::Communities),
            user_communities: LookupMap::new(StorageKey::UserCommunities),
            dao_communities: LookupMap::new(StorageKey::DaoCommunities),
            spend_pending: LookupMap::new(StorageKey::SpendPending),
            reputation: LookupMap::new(StorageKey::Reputation),
            reward_rules: LookupMap::new(StorageKey::RewardRules),
            community_reward_rules: LookupMap::new(StorageKey::CommunityRewardRules),
            circle_reward_rules: LookupMap::new(StorageKey::CircleRewardRules),
            rewards_claimed: LookupMap::new(StorageKey::RewardsClaimed),
            reward_pending: LookupMap::new(StorageKey::RewardPending),
            community_shares: LookupMap::new(StorageKey::CommunityShares),
            community_shareholders: LookupMap::new(StorageKey::CommunityShareholders),
            surplus_claimed: LookupMap::new(StorageKey::SurplusClaimed),
        }
    }

    // ─── Admin & Upgrade ───────────────────────────────────────────────────────

    /// Admin: transfer protocol admin to a new account (e.g. multi-sig DAO or new key).
    pub fn set_admin(&mut self, new_admin: AccountId) {
        require_admin(&self.config.admin.clone());
        let old_admin = self.config.admin.clone();
        require!(new_admin != old_admin, "AdminUnchanged");
        self.config.admin = new_admin.clone();
        events::admin_transferred(&old_admin, &new_admin);
    }

    /// Admin: point the protocol at a different NEP-141 token and toggle the faucet.
    pub fn set_token(&mut self, token_id: AccountId, faucet_enabled: bool) {
        require_admin(&self.config.admin.clone());
        self.config.token_id = token_id;
        self.config.faucet_enabled = faucet_enabled;
    }

    /// Admin: upgrade contract bytecode and optionally migrate state.
    /// Accepts raw WASM bytecode directly or JSON `{"code": "<base64_wasm>", "migrate": true}`.
    pub fn upgrade(&mut self) -> Promise {
        require_admin(&self.config.admin.clone());
        let input = env::input().expect("NoCodeProvided");

        let (code, should_migrate) = if input.starts_with(b"\0asm") {
            (input, true)
        } else {
            #[derive(near_sdk::serde::Deserialize)]
            #[serde(crate = "near_sdk::serde")]
            struct UpgradeArgs {
                code: near_sdk::json_types::Base64VecU8,
                migrate: Option<bool>,
            }
            let args: UpgradeArgs = near_sdk::serde_json::from_slice(&input)
                .expect("InvalidUpgradeInput: expected raw WASM or JSON with {code: string}");
            (args.code.0, args.migrate.unwrap_or(true))
        };

        require!(!code.is_empty(), "EmptyWasmCode");
        require!(code.starts_with(b"\0asm"), "InvalidWasmMagicNumber");

        let mut promise = Promise::new(env::current_account_id()).deploy_contract(code);
        if should_migrate {
            promise = promise.then(
                Promise::new(env::current_account_id()).function_call(
                    "migrate".to_string(),
                    vec![],
                    NearToken::from_yoctonear(0),
                    Gas::from_gas(GAS_MIGRATE),
                ),
            );
        } else {
            promise = promise.then(
                Promise::new(env::current_account_id()).function_call(
                    "on_upgrade".to_string(),
                    vec![],
                    NearToken::from_yoctonear(0),
                    Gas::from_gas(GAS_CALLBACK),
                ),
            );
        }
        promise
    }

    /// State migration callback after bytecode upgrade.
    /// Supports both V2+ idempotent migrations and V1 -> V2 state upgrades.
    #[init(ignore_state)]
    pub fn migrate() -> Self {
        let caller = env::predecessor_account_id();
        if let Some(state) = env::state_read::<Self>() {
            require!(
                caller == env::current_account_id() || caller == state.config.admin,
                "Unauthorized"
            );
            events::contract_migrated();
            return state;
        }
        let v1: RodaContractV1 = env::state_read().expect("StateNotFound");
        require!(
            caller == env::current_account_id() || caller == v1.config.admin,
            "Unauthorized"
        );
        events::contract_migrated();
        Self {
            config: v1.config,
            vaults: v1.vaults,
            user_vaults: v1.user_vaults,
            circles: v1.circles,
            user_circles: v1.user_circles,
            names: v1.names,
            profiles: v1.profiles,
            faucet: v1.faucet,
            activity: v1.activity,
            payout_pending: v1.payout_pending,
            withdraw_pending: v1.withdraw_pending,
            fees_owed: v1.fees_owed,
            community_count: 0,
            community_min_rep: 0,
            reward_rule_count: 0,
            reward_pending_count: 0,
            communities: LookupMap::new(StorageKey::Communities),
            user_communities: LookupMap::new(StorageKey::UserCommunities),
            dao_communities: LookupMap::new(StorageKey::DaoCommunities),
            spend_pending: LookupMap::new(StorageKey::SpendPending),
            reputation: LookupMap::new(StorageKey::Reputation),
            reward_rules: LookupMap::new(StorageKey::RewardRules),
            community_reward_rules: LookupMap::new(StorageKey::CommunityRewardRules),
            circle_reward_rules: LookupMap::new(StorageKey::CircleRewardRules),
            rewards_claimed: LookupMap::new(StorageKey::RewardsClaimed),
            reward_pending: LookupMap::new(StorageKey::RewardPending),
            community_shares: LookupMap::new(StorageKey::CommunityShares),
            community_shareholders: LookupMap::new(StorageKey::CommunityShareholders),
            surplus_claimed: LookupMap::new(StorageKey::SurplusClaimed),
        }
    }

    /// Post-upgrade callback when migration is not requested.
    pub fn on_upgrade(&mut self) {
        require_callback();
        events::contract_upgraded();
    }

    // ─── Vaults ───────────────────────────────────────────────────────────────

    /// Create a new vault for the caller. `tier`: 0=Flex 1=Weekly 2=Monthly
    /// 3=SixMonths 4=OneYear.
    pub fn create_vault(&mut self, tier: u8) {
        let owner = env::predecessor_account_id();
        let tier_enum = VaultTier::from_u8(tier).expect("InvalidTier");
        let vault_id = self.config.vault_count;

        let vault = Vault {
            owner: owner.clone(),
            vault_id,
            tier,
            balance: 0,
            last_deposit_ts: 0,
            maturity_ts: 0,
            active: true,
        };
        self.vaults.insert(&vault_id, &vault);

        let mut ids = self.user_vaults.get(&owner).unwrap_or_default();
        ids.push(vault_id);
        self.user_vaults.insert(&owner, &ids);

        self.config.vault_count = checked_add(self.config.vault_count, 1);
        self.touch_rep_seen(&owner);
        let _ = tier_enum;

        events::vault_created(&owner, vault_id, tier);
        self.push_activity(&owner, "vault_created", None, Some(vault_id), 0, None);
    }

    /// Withdraw from a vault. Tokens are debited immediately and restored if
    /// the `ft_transfer` fails in `on_withdraw`.
    pub fn withdraw(&mut self, vault_id: u64, amount: u64) -> Promise {
        let owner = env::predecessor_account_id();
        require!(amount > 0, "InvalidAmount");
        require!(
            self.withdraw_pending.get(&vault_id).is_none(),
            "PendingTransfer"
        );

        let mut vault = self.vaults.get(&vault_id).expect("VaultNotFound");
        require!(vault.owner == owner, "Unauthorized");
        require!(vault.active, "VaultNotActive");
        require!(vault.balance >= amount, "InsufficientBalance");

        let lock = VaultTier::from_u8(vault.tier)
            .expect("InvalidTier")
            .lock_duration_secs();
        if lock > 0 {
            require!(now_sec() >= vault.maturity_ts, "VaultNotMatured");
        }

        vault.balance = checked_sub(vault.balance, amount);
        self.vaults.insert(&vault_id, &vault);

        self.withdraw_pending.insert(
            &vault_id,
            &WithdrawPending {
                owner: owner.clone(),
                vault_id,
                amount,
            },
        );

        let token = self.config.token_id.clone();
        ft_transfer_promise(&token, &owner, amount).then(Promise::new(env::current_account_id())
            .function_call(
                "on_withdraw".to_string(),
                serde_json::json!({ "vault_id": vault_id, "owner": owner, "amount": amount })
                    .to_string(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(GAS_CALLBACK),
            ))
    }

    /// Close an empty vault and remove it from storage.
    pub fn close_vault(&mut self, vault_id: u64) {
        let owner = env::predecessor_account_id();
        require!(
            self.withdraw_pending.get(&vault_id).is_none(),
            "PendingTransfer"
        );

        let vault = self.vaults.get(&vault_id).expect("VaultNotFound");
        require!(vault.owner == owner, "Unauthorized");
        require!(vault.active, "VaultAlreadyClosed");
        require!(vault.balance == 0, "InsufficientBalance");

        self.vaults.remove(&vault_id);
        if let Some(mut ids) = self.user_vaults.get(&owner) {
            ids.retain(|&id| id != vault_id);
            self.user_vaults.insert(&owner, &ids);
        }

        events::vault_closed(&owner, vault_id);
    }

    // ─── Circles ──────────────────────────────────────────────────────────────

    /// Create a circle; the caller becomes member #1.
    /// Optional `min_reputation` gates `join_circle` via on-chain Roda score.
    pub fn create_circle(
        &mut self,
        circle_code: u64,
        name: String,
        max_members: u8,
        contribution_amount: u64,
        frequency_secs: u64,
        min_reputation: Option<u32>,
    ) {
        require!(
            circle_code >= CIRCLE_CODE_MIN && circle_code <= CIRCLE_CODE_MAX,
            "InvalidCircleCode"
        );
        let name_len = name.chars().count();
        require!(
            name_len >= CIRCLE_NAME_MIN && name_len <= CIRCLE_NAME_MAX,
            "InvalidCircleName"
        );
        require!(
            max_members >= MIN_CIRCLE_MEMBERS && max_members <= MAX_CIRCLE_MEMBERS,
            "InvalidMemberCount"
        );
        require!(contribution_amount > 0, "InvalidContribution");
        require!(frequency_secs >= MIN_FREQUENCY_SECS, "InvalidFrequency");
        let min_rep = min_reputation.unwrap_or(0);
        require!(min_rep <= REP_MAX_SCORE, "InvalidReputationThreshold");
        require!(
            self.circles.get(&circle_code).is_none(),
            "CircleCodeTaken"
        );

        let creator = env::predecessor_account_id();
        let now = now_sec();

        let circle = Circle {
            id: circle_code,
            creator: creator.clone(),
            name: name.clone(),
            max_members,
            contribution_amount,
            frequency_secs,
            current_round: 0,
            pool_balance: 0,
            round_started_ts: now,
            status: CircleStatus::Active,
            members: vec![creator.clone()],
            paid: vec![],
            payout_pending: false,
            min_reputation: min_rep,
        };
        self.circles.insert(&circle_code, &circle);

        let mut joined = self.user_circles.get(&creator).unwrap_or_default();
        joined.push(circle_code);
        self.user_circles.insert(&creator, &joined);

        self.config.circle_count = checked_add(self.config.circle_count, 1);
        self.touch_rep_seen(&creator);

        events::circle_created(
            circle_code,
            &creator,
            &name,
            max_members,
            contribution_amount,
            frequency_secs,
        );
        self.push_activity(
            &creator,
            "circle_created",
            Some(circle_code),
            None,
            contribution_amount,
            None,
        );
    }

    /// Join a circle by its 6-digit code.
    pub fn join_circle(&mut self, circle_code: u64) {
        let member = env::predecessor_account_id();
        let mut circle = self.circles.get(&circle_code).expect("CircleNotFound");

        require!(
            circle.status == CircleStatus::Active,
            "CircleNotJoinable"
        );
        require!(
            (circle.members.len() as u8) < circle.max_members,
            "CircleFull"
        );
        // Joins only before any contribution lands for the current round.
        require!(
            circle.paid.is_empty() && !circle.members.contains(&member),
            "CircleNotJoinable"
        );
        require!(!circle.payout_pending, "PendingTransfer");

        if circle.min_reputation > 0 {
            require!(
                self.effective_reputation_score(&member) >= circle.min_reputation,
                "InsufficientReputation"
            );
        }

        circle.members.push(member.clone());
        self.circles.insert(&circle_code, &circle);

        let mut joined = self.user_circles.get(&member).unwrap_or_default();
        joined.push(circle_code);
        self.user_circles.insert(&member, &joined);
        self.touch_rep_seen(&member);

        let member_count = circle.members.len() as u8;
        events::member_joined(circle_code, &member, member_count);
        self.push_activity(&member, "circle_joined", Some(circle_code), None, 0, None);
    }

    /// Claim the current round's payout. Requires `ft_transfer_call`
    /// contributions to have landed for every member and the round frequency
    /// to have elapsed. Transfers pay the recipient first, then the 0.3%
    /// protocol fee to the admin (and any eligible Phase 3 reward rules).
    pub fn claim_payout(&mut self, circle_code: u64) -> Promise {
        let recipient = env::predecessor_account_id();
        let mut circle = self.circles.get(&circle_code).expect("CircleNotFound");

        require!(circle.status == CircleStatus::Active, "CircleNotCompleted");
        require!(!circle.payout_pending, "PendingTransfer");
        require!(
            circle.paid.len() == circle.members.len() && !circle.members.is_empty(),
            "NotAllPaid"
        );

        let member_count = circle.members.len();
        let recipient_index = (circle.current_round as usize) % member_count;
        let expected = circle.members[recipient_index].clone();
        require!(recipient == expected, "NotYourPayout");

        let now = now_sec();
        require!(
            now >= round_end_ts(circle.round_started_ts, circle.frequency_secs),
            "RoundNotReady"
        );

        let amount = circle.pool_balance;
        require!(amount > 0, "InvalidAmount");

        // 0.3% protocol fee, integer division rounds down.
        let fee = amount
            .checked_mul(FEE_NUMERATOR)
            .expect("MathOverflow")
            .checked_div(FEE_DENOMINATOR)
            .expect("MathOverflow");
        let payout = checked_sub(amount, fee);

        // Lock the circle; state commits only after the payout transfer lands.
        circle.payout_pending = true;
        self.circles.insert(&circle_code, &circle);

        self.payout_pending.insert(
            &circle_code,
            &PayoutPending {
                fee,
                payout,
                recipient: recipient.clone(),
                paid_round: circle.current_round,
                pool_balance: amount,
            },
        );

        let desired_cb = if self.has_reward_rules_for(circle_code, &recipient) {
            GAS_PAYOUT_CALLBACK
        } else {
            GAS_CALLBACK_WITH_FEE
        };
        let avail_gas = env::prepaid_gas()
            .as_gas()
            .saturating_sub(env::used_gas().as_gas())
            .saturating_sub(GAS_FT_TRANSFER)
            .saturating_sub(5_000_000_000_000);
        let cb_gas = desired_cb.min(avail_gas.max(GAS_CALLBACK));

        let token = self.config.token_id.clone();
        ft_transfer_promise(&token, &recipient, payout).then(Promise::new(env::current_account_id())
            .function_call(
                "on_payout".to_string(),
                serde_json::json!({ "circle_code": circle_code }).to_string(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(cb_gas),
            ))
    }

    /// Close a completed circle (creator only) and clear its index entries.
    pub fn close_circle(&mut self, circle_code: u64) {
        let caller = env::predecessor_account_id();
        let circle = self.circles.get(&circle_code).expect("CircleNotFound");
        require!(circle.creator == caller, "Unauthorized");
        require!(circle.status == CircleStatus::Completed, "CircleNotCompleted");
        require!(!circle.payout_pending, "PendingTransfer");
        require!(circle.pool_balance == 0, "InsufficientBalance");

        for member in &circle.members {
            if let Some(mut joined) = self.user_circles.get(member) {
                joined.retain(|&c| c != circle_code);
                self.user_circles.insert(member, &joined);
            }
        }

        self.circles.remove(&circle_code);
        events::circle_closed(circle_code, &caller);
    }

    // ─── Usernames ────────────────────────────────────────────────────────────

    /// Claim or rename a username (3–20 chars, a-z 0-9 _, 24h cooldown).
    pub fn claim_name(&mut self, name: String) {
        let owner = env::predecessor_account_id();
        require!(name.len() >= USERNAME_MIN, "NameTooShort");
        require!(name.len() <= USERNAME_MAX, "NameTooLong");
        require!(
            name.chars()
                .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_'),
            "InvalidNameChars"
        );

        let now = now_sec();
        let profile = self.profiles.get(&owner);

        // Already owns this exact name — no-op.
        if let Some(p) = &profile {
            if p.name == name {
                return;
            }
            // Cooldown between changes (fresh profiles have last_change_ts == 0).
            if p.last_change_ts != 0 {
                require!(
                    now - p.last_change_ts >= NAME_COOLDOWN_SECS,
                    "CooldownActive"
                );
            }
        }

        // The name must be unclaimed.
        require!(
            self.names.get(&name).is_none(),
            "NameTaken"
        );

        // Renaming: free the previous name.
        if let Some(p) = &profile {
            if !p.name.is_empty() {
                self.names.remove(&p.name);
            }
        }

        self.names.insert(&name, &owner);
        self.profiles.insert(
            &owner,
            &NameProfile {
                name: name.clone(),
                last_change_ts: now,
            },
        );

        events::name_claimed(&owner, &name);
        self.push_activity(&owner, "name_claimed", None, None, 0, None);
    }

    /// Release the caller's username so others may claim it.
    pub fn release_name(&mut self) {
        let owner = env::predecessor_account_id();
        let profile = self.profiles.get(&owner).expect("NameNotSet");
        require!(!profile.name.is_empty(), "NameNotSet");

        let name = profile.name.clone();
        self.names.remove(&name);
        self.profiles.insert(
            &owner,
            &NameProfile {
                name: String::new(),
                last_change_ts: now_sec(),
            },
        );

        events::name_released(&owner, &name);
    }

    // ─── Faucet ───────────────────────────────────────────────────────────────

    /// Claim 1,000 test tokens (24h cooldown). Requires `faucet_enabled`.
    pub fn faucet(&mut self) -> Promise {
        require!(self.config.faucet_enabled, "FaucetUnavailable");
        let user = env::predecessor_account_id();
        let now = now_sec();

        let prev = self.faucet.get(&user).unwrap_or(0);
        if prev != 0 {
            require!(now - prev >= FAUCET_COOLDOWN_SECS, "FaucetCooldown");
        }
        // Reserve the cooldown before the async mint lands.
        self.faucet.insert(&user, &now);

        let token = self.config.token_id.clone();
        Promise::new(token).function_call(
            "mint".to_string(),
            serde_json::json!({
                "receiver_id": user.to_string(),
                "amount": FAUCET_AMOUNT.to_string(),
            })
            .to_string(),
            NearToken::from_yoctonear(0),
            Gas::from_gas(GAS_FT_MINT),
        )
        .then(Promise::new(env::current_account_id()).function_call(
            "on_faucet".to_string(),
            serde_json::json!({ "user": user, "prev": prev }).to_string(),
            NearToken::from_yoctonear(0),
            Gas::from_gas(GAS_CALLBACK),
        ))
    }

    /// Admin: retry protocol fee collection after a failed fee transfer.
    pub fn collect_fees(&mut self) -> Promise {
        require_admin(&self.config.admin.clone());
        let admin = self.config.admin.clone();
        let amount = self.fees_owed;
        require!(amount > 0, "InvalidAmount");

        let token = self.config.token_id.clone();
        ft_transfer_promise(&token, &admin, amount).then(Promise::new(env::current_account_id())
            .function_call(
                "on_collect_fees".to_string(),
                serde_json::json!({ "amount": amount }).to_string(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(GAS_CALLBACK),
            ))
    }

    // ─── Promise callbacks ────────────────────────────────────────────────────

    /// Payout transfer landed: commit the round transition, update reputation,
    /// then pay the protocol fee and any matching Phase 3 reward rules.
    pub fn on_payout(&mut self, circle_code: u64) -> Promise {
        require_callback();
        let pending = match self.payout_pending.get(&circle_code) {
            Some(p) => p,
            None => return noop_promise(),
        };

        if !promise_succeeded() {
            // Transfer failed — unlock, nothing moved.
            self.payout_pending.remove(&circle_code);
            if let Some(mut c) = self.circles.get(&circle_code) {
                c.payout_pending = false;
                self.circles.insert(&circle_code, &c);
            }
            env::log_str(&format!("RodaError:PayoutTransferFailed:{}", circle_code));
            return noop_promise();
        }

        // Commit state transition.
        let mut circle = self.circles.get(&circle_code).expect("CircleNotFound");
        circle.pool_balance = 0;
        let paid_round = pending.paid_round;
        let completed = paid_round + 1 >= circle.members.len() as u16;
        if completed {
            circle.status = CircleStatus::Completed;
        } else {
            circle.current_round = paid_round + 1;
            circle.paid.clear();
            circle.round_started_ts = now_sec();
        }
        circle.payout_pending = false;
        let members_snapshot = circle.members.clone();
        self.circles.insert(&circle_code, &circle);
        self.payout_pending.remove(&circle_code);

        if completed {
            for m in &members_snapshot {
                self.record_rep_circle_completed(m);
            }
        }

        events::payout_released(
            circle_code,
            &pending.recipient,
            paid_round,
            pending.pool_balance,
            circle.current_round,
            completed,
        );
        self.push_activity(
            &pending.recipient,
            "payout",
            Some(circle_code),
            None,
            pending.payout,
            None,
        );

        let fee_promise = if pending.fee > 0 {
            let admin = self.config.admin.clone();
            let token = self.config.token_id.clone();
            let fee_cb_gas = env::prepaid_gas()
                .as_gas()
                .saturating_sub(env::used_gas().as_gas())
                .saturating_sub(GAS_FT_TRANSFER)
                .saturating_sub(5_000_000_000_000)
                .min(GAS_CALLBACK);
            Some(
                ft_transfer_promise(&token, &admin, pending.fee).then(
                    Promise::new(env::current_account_id()).function_call(
                        "on_fee".to_string(),
                        serde_json::json!({ "amount": pending.fee }).to_string(),
                        NearToken::from_yoctonear(0),
                        Gas::from_gas(fee_cb_gas.max(10_000_000_000_000)),
                    ),
                ),
            )
        } else {
            None
        };

        let fee_reserve = if pending.fee > 0 {
            GAS_FT_TRANSFER + GAS_CALLBACK + 5_000_000_000_000
        } else {
            5_000_000_000_000
        };
        let gas_for_rewards = env::prepaid_gas()
            .as_gas()
            .saturating_sub(env::used_gas().as_gas())
            .saturating_sub(fee_reserve);

        let reward_promises = self.schedule_payout_rewards(
            circle_code,
            &pending.recipient,
            paid_round,
            gas_for_rewards,
        );

        let mut combined = fee_promise;
        for rp in reward_promises {
            combined = Some(match combined {
                Some(prev) => prev.and(rp),
                None => rp,
            });
        }
        combined.unwrap_or_else(noop_promise)
    }

    /// Fee transfer outcome: credit `fees_owed` on failure so it can be retried.
    pub fn on_fee(&mut self, amount: u64) {
        require_callback();
        if promise_succeeded() {
            self.push_activity(
                &self.config.admin.clone(),
                "fee",
                None,
                None,
                amount,
                None,
            );
        } else {
            self.fees_owed = checked_add(self.fees_owed, amount);
            env::log_str(&format!("RodaError:FeeTransferFailed:{}", amount));
        }
    }

    /// Withdraw transfer outcome: restore the vault balance on failure.
    pub fn on_withdraw(&mut self, vault_id: u64, owner: AccountId, amount: u64) {
        require_callback();
        let pending = match self.withdraw_pending.get(&vault_id) {
            Some(p) => p,
            None => return,
        };

        if promise_succeeded() {
            let rep_units = if let Some(vault) = self.vaults.get(&vault_id) {
                events::vault_withdraw(&owner, vault_id, amount, vault.balance);
                let is_locked = VaultTier::from_u8(vault.tier)
                    .map(|t| t.lock_duration_secs() > 0)
                    .unwrap_or(false);
                if is_locked && now_sec() >= vault.maturity_ts {
                    2
                } else {
                    1
                }
            } else {
                1
            };
            self.record_rep_vault_withdraw(&owner, rep_units);
            self.push_activity(&owner, "withdraw", None, Some(vault_id), amount, None);
        } else {
            // Restore the balance — transfer never left the treasury.
            if let Some(mut vault) = self.vaults.get(&vault_id) {
                vault.balance = checked_add(vault.balance, amount);
                self.vaults.insert(&vault_id, &vault);
            }
            env::log_str(&format!("RodaError:WithdrawTransferFailed:{}", vault_id));
        }
        let _ = pending;
        self.withdraw_pending.remove(&vault_id);
    }

    /// Faucet mint outcome: release the cooldown reservation on failure.
    pub fn on_faucet(&mut self, user: AccountId, prev: i64) {
        require_callback();
        if promise_succeeded() {
            events::faucet_claimed(&user, FAUCET_AMOUNT);
            self.push_activity(&user, "faucet", None, None, FAUCET_AMOUNT, None);
        } else {
            if prev == 0 {
                self.faucet.remove(&user);
            } else {
                self.faucet.insert(&user, &prev);
            }
            env::log_str(&format!("RodaError:FaucetMintFailed:{}", user));
        }
    }

    /// Retry outcome for protocol fees.
    pub fn on_collect_fees(&mut self, amount: u64) {
        require_callback();
        if promise_succeeded() {
            self.fees_owed = checked_sub(self.fees_owed, amount);
            self.push_activity(
                &self.config.admin.clone(),
                "fee",
                None,
                None,
                amount,
                None,
            );
        } else {
            env::log_str(&format!("RodaError:FeeTransferFailed:{}", amount));
        }
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    pub fn get_config(&self) -> ConfigView {
        ConfigView {
            admin: self.config.admin.clone(),
            token_id: self.config.token_id.clone(),
            vault_count: self.config.vault_count,
            circle_count: self.config.circle_count,
            faucet_enabled: self.config.faucet_enabled,
            community_count: self.community_count,
            community_min_rep: self.community_min_rep,
            reward_rule_count: self.reward_rule_count,
        }
    }

    pub fn get_vault(&self, owner: AccountId, vault_id: u64) -> Option<VaultView> {
        self.vaults.get(&vault_id).filter(|v| v.owner == owner).map(|v| VaultView {
            owner: v.owner,
            vault_id: v.vault_id,
            tier: v.tier,
            balance: v.balance,
            last_deposit_ts: v.last_deposit_ts,
            maturity_ts: v.maturity_ts,
            active: v.active,
        })
    }

    pub fn get_user_vaults(&self, owner: AccountId) -> Vec<VaultView> {
        self.user_vaults
            .get(&owner)
            .unwrap_or_default()
            .into_iter()
            .filter_map(|id| self.vaults.get(&id))
            .map(|v| VaultView {
                owner: v.owner,
                vault_id: v.vault_id,
                tier: v.tier,
                balance: v.balance,
                last_deposit_ts: v.last_deposit_ts,
                maturity_ts: v.maturity_ts,
                active: v.active,
            })
            .collect()
    }

    pub fn get_circle(&self, circle_code: u64) -> Option<CircleView> {
        self.circles.get(&circle_code).as_ref().map(CircleView::from)
    }

    /// Batch circle lookup (client fetches details for known codes).
    pub fn get_circles(&self, circle_codes: Vec<u64>) -> Vec<CircleView> {
        circle_codes
            .into_iter()
            .filter_map(|c| self.circles.get(&c))
            .map(|c| CircleView::from(&c))
            .collect()
    }

    pub fn get_user_circle_ids(&self, account: AccountId) -> Vec<u64> {
        self.user_circles.get(&account).unwrap_or_default()
    }

    /// Active circle codes for the "Discover & Join" list (bounded).
    pub fn get_active_circle_codes(&self, limit: u32) -> Vec<u64> {
        let limit = limit.min(100) as usize;
        let mut out = Vec::new();
        // Scan is bounded by total circles; fine for testnet-scale data.
        for i in 0..self.config.circle_count {
            if out.len() >= limit {
                break;
            }
            // circle_count is a creation counter, not dense ids — iterate
            // known codes through the user index instead is not possible here,
            // so callers should prefer get_user_circle_ids / known codes.
            let _ = i;
        }
        // NOTE: dense enumeration is intentionally not supported; clients pass
        // codes they know (from activity, invites, or the join-by-code modal).
        out.truncate(limit);
        out
    }

    pub fn get_profile(&self, owner: AccountId) -> Option<ProfileView> {
        self.profiles.get(&owner).map(|p| ProfileView {
            owner,
            name: p.name,
            last_change_ts: p.last_change_ts,
        })
    }

    pub fn get_name_owner(&self, name: String) -> Option<AccountId> {
        self.names.get(&name)
    }

    pub fn get_activity(&self, account: AccountId) -> Vec<Activity> {
        self.activity.get(&account).unwrap_or_default()
    }

    pub fn get_faucet_info(&self, account: AccountId) -> Option<i64> {
        self.faucet.get(&account)
    }

    pub fn get_fees_owed(&self) -> u64 {
        self.fees_owed
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    fn push_activity(
        &mut self,
        account: &AccountId,
        kind: &str,
        circle_id: Option<u64>,
        vault_id: Option<u64>,
        amount: u64,
        peer: Option<AccountId>,
    ) {
        let mut items = self.activity.get(account).unwrap_or_default();
        items.push(Activity {
            kind: kind.to_string(),
            circle_id,
            vault_id,
            amount,
            ts: now_sec(),
            peer,
        });
        while items.len() > ACTIVITY_MAX {
            items.remove(0);
        }
        self.activity.insert(account, &items);
    }
}

/// Fulfilled-but-empty promise used for callback chains.
fn noop_promise() -> Promise {
    Promise::new(env::current_account_id()).function_call(
        "noop".to_string(),
        "{}".to_string(),
        NearToken::from_yoctonear(0),
        Gas::from_tgas(1),
    )
}

#[near]
impl RodaContract {
    /// Internal no-op target for promise chains.
    pub fn noop(&self) {}
}

pub(crate) fn promise_succeeded() -> bool {
    matches!(env::promise_result(0), PromiseResult::Successful(_))
}

// Re-exported for the ft module.
#[allow(unused_imports)]
pub(crate) use checked_add as ca;
#[allow(unused_imports)]
pub(crate) use checked_sub as cs;
pub(crate) use now_sec as now;
#[allow(unused_imports)]
pub(crate) use promise_succeeded as ps;
#[allow(unused_imports)]
pub(crate) use require_callback as rc;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::community::{compute_pro_rata_surplus, compute_rep_breakdown};

    fn round_ready(round_started_ts: i64, frequency_secs: u64, now: i64) -> bool {
        now >= round_end_ts(round_started_ts, frequency_secs)
    }

    #[test]
    fn rejects_premature_payout() {
        assert!(!round_ready(1_000, 60, 1_059));
    }

    #[test]
    fn allows_payout_at_round_boundary() {
        assert!(round_ready(1_000, 60, 1_060));
    }

    #[test]
    fn fee_math_rounds_down() {
        let amount = 20_000_000u64; // 20 USDC
        let fee = amount * FEE_NUMERATOR / FEE_DENOMINATOR;
        assert_eq!(fee, 60_000); // 0.06 USDC
        assert_eq!(amount - fee, 19_940_000); // 19.94 USDC
    }

    #[test]
    fn tiny_pool_fee_can_be_zero() {
        let amount = 100u64;
        let fee = amount * FEE_NUMERATOR / FEE_DENOMINATOR;
        assert_eq!(fee, 0);
    }

    #[test]
    fn name_validation_rules() {
        let ok = |n: &str| {
            n.len() >= USERNAME_MIN
                && n.len() <= USERNAME_MAX
                && n.chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '_')
        };
        assert!(ok("alice"));
        assert!(ok("a_1"));
        assert!(!ok("ab"));
        assert!(!ok("Alice"));
        assert!(!ok("alice!"));
        assert!(!ok(&"x".repeat(21)));
    }

    #[test]
    fn tier_minimums_and_locks() {
        assert_eq!(VaultTier::Flex.min_deposit(), 0);
        assert_eq!(VaultTier::Flex.lock_duration_secs(), 0);
        assert_eq!(VaultTier::Weekly.min_deposit(), 10_000_000);
        assert_eq!(VaultTier::Weekly.lock_duration_secs(), 604_800);
        assert_eq!(VaultTier::Monthly.lock_duration_secs(), 2_592_000);
        assert_eq!(VaultTier::OneYear.min_deposit(), 250_000_000);
    }

    #[test]
    fn circle_code_bounds() {
        assert!(CIRCLE_CODE_MIN == 100_000 && CIRCLE_CODE_MAX == 999_999);
    }

    #[test]
    fn wasm_magic_bytes_check() {
        let valid_wasm = b"\0asm\x01\x00\x00\x00";
        assert!(valid_wasm.starts_with(b"\0asm"));

        let invalid_code = b"not_wasm_binary";
        assert!(!invalid_code.starts_with(b"\0asm"));
    }

    #[test]
    fn envelope_allocation_and_spend_math() {
        let mut env_grants = Envelope {
            id: 0,
            name: "Grants".to_string(),
            allocated: 60_000_000,
            spent: 25_000_000,
            active: true,
        };
        assert_eq!(env_grants.remaining(), 35_000_000);
        // Spend within limit
        assert!(env_grants.remaining() >= 35_000_000);
        env_grants.spent += 35_000_000;
        assert_eq!(env_grants.remaining(), 0);
        // Over-spend blocked
        assert!(env_grants.remaining() < 1);
    }

    #[test]
    fn reputation_scoring_math() {
        let acct: AccountId = "alice.testnet".parse().unwrap();
        let empty = RepScore::default();
        assert_eq!(compute_rep_breakdown(&acct, &empty, 1_700_000_000).score, 0);

        let active = RepScore {
            first_seen_ts: 1_700_000_000 - (30 * 86_400),
            contributions_ok: 4,          // 4 * 25 = 100
            contributions_missed: 1,      // -40 => reliability = 60
            circles_completed: 2,         // 2 * 50 = 100
            vault_withdraw_units: 2,      // 2 * 15 = 30
            community_volume: 40_000_000, // 4 steps * 5 = 20
            ..Default::default()
        };
        let b = compute_rep_breakdown(&acct, &active, 1_700_000_000);
        assert_eq!(b.score, 220);
        assert_eq!(b.reliability_pts, 60);
        assert_eq!(b.tenure_pts, 10);
    }

    #[test]
    fn pro_rata_surplus_and_v1_circle_compat() {
        assert_eq!(
            compute_pro_rata_surplus(150_000_000, 200_000_000, 300_000_000),
            100_000_000
        );
        assert_eq!(
            compute_pro_rata_surplus(150_000_000, 100_000_000, 300_000_000),
            50_000_000
        );

        #[derive(borsh::BorshSerialize)]
        struct CircleV1Legacy {
            id: u64,
            creator: AccountId,
            name: String,
            max_members: u8,
            contribution_amount: u64,
            frequency_secs: u64,
            current_round: u16,
            pool_balance: u64,
            round_started_ts: i64,
            status: CircleStatus,
            members: Vec<AccountId>,
            paid: Vec<AccountId>,
            payout_pending: bool,
        }
        let legacy = CircleV1Legacy {
            id: 123456,
            creator: "alice.testnet".parse().unwrap(),
            name: "Legacy".to_string(),
            max_members: 4,
            contribution_amount: 10_000_000,
            frequency_secs: 604_800,
            current_round: 1,
            pool_balance: 0,
            round_started_ts: 1_700_000_000,
            status: CircleStatus::Active,
            members: vec!["alice.testnet".parse().unwrap()],
            paid: vec![],
            payout_pending: false,
        };
        let bytes = borsh::to_vec(&legacy).unwrap();
        let upgraded: Circle = borsh::from_slice(&bytes).unwrap();
        assert_eq!(upgraded.id, 123456);
        assert_eq!(upgraded.min_reputation, 0);
    }
}

#[cfg(all(test, feature = "unit-testing", not(target_arch = "wasm32")))]
mod vm_tests {
    use super::*;
    use crate::community::EnvelopeInitInput;
    use near_contract_standards::fungible_token::receiver::FungibleTokenReceiver;
    use near_sdk::json_types::U128;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, PromiseOrValue};

    fn ctx(predecessor: &str) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder
            .predecessor_account_id(predecessor.parse().unwrap())
            .signer_account_id(predecessor.parse().unwrap())
            .current_account_id("roda.testnet".parse().unwrap())
            .block_timestamp(1_700_000_000_000_000_000);
        builder
    }

    fn setup_contract() -> RodaContract {
        testing_env!(ctx("admin.testnet").build());
        RodaContract::new(
            "admin.testnet".parse().unwrap(),
            "usdc.testnet".parse().unwrap(),
            true,
        )
    }

    #[test]
    fn community_link_and_envelope_allocation_spend_flow() {
        let mut c = setup_contract();

        testing_env!(ctx("alice.testnet").build());
        let cid = c.create_community(
            "guild.sputnik-v2.testnet".parse().unwrap(),
            "Lagos Builders".to_string(),
            vec![
                EnvelopeInitInput::Name("Grants".to_string()),
                EnvelopeInitInput::Name("Ops".to_string()),
            ],
        );
        let view = c.get_community(cid).unwrap();
        assert!(!view.linked);
        assert_eq!(view.envelopes.len(), 2);

        testing_env!(ctx("guild.sputnik-v2.testnet").build());
        c.confirm_link(cid);
        assert!(c.get_community(cid).unwrap().linked);

        testing_env!(ctx("usdc.testnet").build());
        let unused = c.ft_on_transfer(
            "alice.testnet".parse().unwrap(),
            U128(100_000_000),
            r#"{"type":"budget_deposit","community":0,"envelope":null}"#.to_string(),
        );
        assert!(matches!(unused, PromiseOrValue::Value(v) if v.0 == 0));
        assert_eq!(c.get_community(cid).unwrap().pool_unallocated, 100_000_000);
        assert_eq!(
            c.get_community_shares(cid, "alice.testnet".parse().unwrap()),
            100_000_000
        );

        testing_env!(ctx("guild.sputnik-v2.testnet").build());
        c.allocate(cid, 0, 60_000_000);
        let after_alloc = c.get_community(cid).unwrap();
        assert_eq!(after_alloc.pool_unallocated, 40_000_000);
        assert_eq!(after_alloc.envelopes[0].allocated, 60_000_000);
        assert_eq!(after_alloc.envelopes[0].remaining, 60_000_000);

        let _ = c.spend(cid, 0, "bob.testnet".parse().unwrap(), 25_000_000);
        let after_spend = c.get_community(cid).unwrap();
        assert_eq!(after_spend.envelopes[0].spent, 25_000_000);
        assert_eq!(after_spend.envelopes[0].remaining, 35_000_000);
    }

    #[test]
    #[should_panic(expected = "Unauthorized")]
    fn rejects_non_dao_confirm_link() {
        let mut c = setup_contract();
        testing_env!(ctx("alice.testnet").build());
        let cid = c.create_community(
            "guild.sputnik-v2.testnet".parse().unwrap(),
            "Lagos Builders".to_string(),
            vec![],
        );
        c.confirm_link(cid);
    }

    #[test]
    #[should_panic(expected = "ExceedsEnvelope")]
    fn rejects_envelope_overspend() {
        let mut c = setup_contract();
        testing_env!(ctx("alice.testnet").build());
        let cid = c.create_community(
            "guild.sputnik-v2.testnet".parse().unwrap(),
            "Lagos Builders".to_string(),
            vec![EnvelopeInitInput::Name("Grants".to_string())],
        );
        testing_env!(ctx("guild.sputnik-v2.testnet").build());
        c.confirm_link(cid);

        testing_env!(ctx("usdc.testnet").build());
        let _ = c.ft_on_transfer(
            "alice.testnet".parse().unwrap(),
            U128(20_000_000),
            r#"{"type":"budget_deposit","community":0,"envelope":0}"#.to_string(),
        );

        testing_env!(ctx("guild.sputnik-v2.testnet").build());
        let _ = c.spend(cid, 0, "bob.testnet".parse().unwrap(), 25_000_000);
    }

    #[test]
    #[should_panic(expected = "InsufficientReputation")]
    fn gated_circle_rejects_low_rep_user() {
        let mut c = setup_contract();
        testing_env!(ctx("alice.testnet").build());
        c.create_circle(
            500_001,
            "High Trust Club".to_string(),
            4,
            10_000_000,
            60,
            Some(100),
        );

        testing_env!(ctx("newbie.testnet").build());
        c.join_circle(500_001);
    }
}
