use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{env, near, require, AccountId, Gas, NearToken, Promise};

use crate::constants::*;
use crate::events;
use crate::state::*;
use crate::{checked_add, checked_sub, ft_transfer_promise, now_sec, promise_succeeded, require_admin, require_callback, RodaContract, RodaContractExt};

/// Flexible input for initial envelopes in `create_community`:
/// accepts either `["Marketing", "Events"]` or `[{ "name": "Marketing" }]`.
#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde", untagged)]
pub enum EnvelopeInitInput {
    Name(String),
    Spec { name: String },
}

impl EnvelopeInitInput {
    fn into_name(self) -> String {
        match self {
            EnvelopeInitInput::Name(s) => s,
            EnvelopeInitInput::Spec { name } => name,
        }
    }
}

/// Pure helper computing normalized reputation score and itemized points.
pub fn compute_rep_breakdown(account: &AccountId, rep: &RepScore, now: i64) -> RepBreakdownView {
    let tenure_days = if rep.first_seen_ts > 0 {
        (now.saturating_sub(rep.first_seen_ts).max(0) / SECS_PER_DAY) as u32
    } else {
        rep.tenure_days
    };

    let reliability_raw = rep
        .contributions_ok
        .saturating_mul(REP_POINTS_CONTRIBUTION)
        .min(REP_CAP_CONTRIBUTION);
    let penalty_pts = rep.contributions_missed.saturating_mul(REP_PENALTY_MISSED);
    let reliability_pts = reliability_raw.saturating_sub(penalty_pts);

    let completion_pts = rep
        .circles_completed
        .saturating_mul(REP_POINTS_CIRCLE_COMPLETE)
        .min(REP_CAP_CIRCLE_COMPLETE);
    let vault_pts = rep
        .vault_withdraw_units
        .saturating_mul(REP_POINTS_VAULT_UNIT)
        .min(REP_CAP_VAULT);

    let volume_steps = (rep.community_volume / REP_VOLUME_STEP_USDC) as u32;
    let volume_pts = volume_steps
        .saturating_mul(REP_POINTS_VOLUME_STEP)
        .min(REP_CAP_VOLUME);
    let tenure_pts = (tenure_days / REP_TENURE_DAYS_PER_POINT).min(REP_CAP_TENURE);

    let score = reliability_pts
        .saturating_add(completion_pts)
        .saturating_add(vault_pts)
        .saturating_add(volume_pts)
        .saturating_add(tenure_pts)
        .min(REP_MAX_SCORE);

    RepBreakdownView {
        account: account.clone(),
        score,
        reliability_pts,
        completion_pts,
        vault_pts,
        volume_pts,
        tenure_pts,
        penalty_pts,
        contributions_ok: rep.contributions_ok,
        contributions_missed: rep.contributions_missed,
        circles_completed: rep.circles_completed,
        tenure_days,
        vault_withdraw_units: rep.vault_withdraw_units,
        community_volume: rep.community_volume,
        sybil_note: "Weighted by capital at risk (verified USDC contributions, completed circles, matured vaults, and community deposits) plus account tenure — creating empty accounts yields 0 reputation.".to_string(),
    }
}

/// Pure helper computing pro-rata dissolution payout using u128 intermediate math.
pub fn compute_pro_rata_surplus(dissolve_surplus: u64, user_shares: u64, total_shares: u64) -> u64 {
    if dissolve_surplus == 0 || user_shares == 0 || total_shares == 0 {
        return 0;
    }
    ((dissolve_surplus as u128)
        .checked_mul(user_shares as u128)
        .expect("MathOverflow")
        .checked_div(total_shares as u128)
        .expect("MathOverflow")) as u64
}

#[near]
impl RodaContract {
    // ─── Phase 1: Shared Budgets & Community Coordination ────────────────────

    /// Stage a community linked to a Sputnik DAO (`dao_id`).
    /// Starts with `linked = false`; the DAO executes `confirm_link` via a Sputnik `Call`
    /// proposal to prove DAO existence and governance consent.
    pub fn create_community(
        &mut self,
        dao_id: AccountId,
        name: String,
        envelopes: Vec<EnvelopeInitInput>,
    ) -> u64 {
        let creator = env::predecessor_account_id();

        if self.community_min_rep > 0 {
            require!(
                self.effective_reputation_score(&creator) >= self.community_min_rep,
                "InsufficientReputation"
            );
        }

        require!(
            self.dao_communities.get(&dao_id).is_none(),
            "DaoAlreadyLinked"
        );

        let trimmed = name.trim().to_string();
        let name_len = trimmed.chars().count();
        require!(
            name_len >= COMMUNITY_NAME_MIN && name_len <= COMMUNITY_NAME_MAX,
            "InvalidCommunityName"
        );
        require!(envelopes.len() <= MAX_ENVELOPES, "TooManyEnvelopes");

        let mut user_ids = self.user_communities.get(&creator).unwrap_or_default();
        require!(
            user_ids.len() < MAX_COMMUNITIES_PER_USER,
            "TooManyCommunities"
        );

        let mut built_envelopes = Vec::with_capacity(envelopes.len());
        for (idx, item) in envelopes.into_iter().enumerate() {
            let label = item.into_name().trim().to_string();
            let len = label.chars().count();
            require!(
                len >= ENVELOPE_NAME_MIN && len <= ENVELOPE_NAME_MAX,
                "InvalidEnvelopeName"
            );
            built_envelopes.push(Envelope {
                id: idx as u64,
                name: label,
                allocated: 0,
                spent: 0,
                active: true,
            });
        }

        let id = self.community_count;
        self.community_count = checked_add(self.community_count, 1);

        let community = Community {
            id,
            dao_id: dao_id.clone(),
            creator: creator.clone(),
            name: trimmed.clone(),
            created_ts: now_sec(),
            envelopes: built_envelopes,
            pool_unallocated: 0,
            linked: false,
            dissolved: false,
            total_shares: 0,
            dissolve_surplus: 0,
        };
        let env_count = community.envelopes.len();
        self.communities.insert(&id, &community);

        user_ids.push(id);
        self.user_communities.insert(&creator, &user_ids);
        self.touch_rep_seen(&creator);

        events::community_create(id, &dao_id, &creator, &trimmed, env_count);
        self.push_activity(&creator, "community_created", None, Some(id), 0, Some(dao_id));

        id
    }

    /// Sputnik DAO `Call` target confirming governance consent and binding `dao_id`.
    pub fn confirm_link(&mut self, community_id: u64) {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(!community.linked, "AlreadyLinked");
        require!(
            self.dao_communities.get(&caller).is_none(),
            "DaoAlreadyLinked"
        );

        community.linked = true;
        self.communities.insert(&community_id, &community);
        self.dao_communities.insert(&caller, &community_id);

        events::community_link(community_id, &caller);
    }

    /// Sputnik DAO `Call`: allocate unallocated community pool funds to an active envelope.
    pub fn allocate(&mut self, community_id: u64, envelope_id: u64, amount: u64) {
        self.allocate_internal(community_id, envelope_id, amount);
    }

    /// Alias matching Sputnik `Call` convention.
    pub fn community_allocate(&mut self, community_id: u64, envelope_id: u64, amount: u64) {
        self.allocate_internal(community_id, envelope_id, amount);
    }

    /// Sputnik DAO `Call`: disburse USDC from an active budget envelope to `recipient`.
    pub fn spend(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        recipient: AccountId,
        amount: u64,
    ) -> Promise {
        self.spend_internal(community_id, envelope_id, recipient, amount)
    }

    /// Alias referenced in architecture diagram (`method: "community_spend"`).
    pub fn community_spend(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        recipient: AccountId,
        amount: u64,
    ) -> Promise {
        self.spend_internal(community_id, envelope_id, recipient, amount)
    }

    /// Callback for `spend` / `community_spend`: emits spend event or rolls back optimistic debit.
    pub fn on_spend(&mut self, community_id: u64, envelope_id: u64) {
        require_callback();
        let pending = match self.spend_pending.get(&(community_id, envelope_id)) {
            Some(p) => p,
            None => return,
        };

        if promise_succeeded() {
            if let Some(community) = self.communities.get(&community_id) {
                if let Some(env_item) = community.envelopes.iter().find(|e| e.id == envelope_id) {
                    events::envelope_spend(
                        community_id,
                        envelope_id,
                        &pending.recipient,
                        pending.amount,
                        env_item.spent,
                        env_item.remaining(),
                    );
                }
                self.push_activity(
                    &pending.recipient,
                    "envelope_spend",
                    None,
                    Some(community_id),
                    pending.amount,
                    Some(community.dao_id),
                );
            }
        } else {
            if let Some(mut community) = self.communities.get(&community_id) {
                if let Some(env_item) = community
                    .envelopes
                    .iter_mut()
                    .find(|e| e.id == envelope_id)
                {
                    env_item.spent = checked_sub(env_item.spent, pending.amount);
                }
                self.communities.insert(&community_id, &community);
            }
            env::log_str(&format!(
                "RodaError:SpendTransferFailed:{}:{}",
                community_id, envelope_id
            ));
        }

        self.spend_pending.remove(&(community_id, envelope_id));
    }

    /// Sputnik DAO `Call`: append a new budget envelope (up to `MAX_ENVELOPES`).
    pub fn add_envelope(&mut self, community_id: u64, name: String) -> u64 {
        self.add_envelope_internal(community_id, name)
    }

    /// Alias for `add_envelope`.
    pub fn community_add_envelope(&mut self, community_id: u64, name: String) -> u64 {
        self.add_envelope_internal(community_id, name)
    }

    /// Sputnik DAO `Call`: rename or open/close an envelope.
    /// Closing an active envelope returns its unspent allocation to `pool_unallocated`.
    pub fn set_envelope(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        name: Option<String>,
        active: Option<bool>,
    ) {
        self.set_envelope_internal(community_id, envelope_id, name, active);
    }

    /// Alias for `set_envelope`.
    pub fn community_set_envelope(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        name: Option<String>,
        active: Option<bool>,
    ) {
        self.set_envelope_internal(community_id, envelope_id, name, active);
    }

    // ─── Phase 2: Reputation Governance & Views ──────────────────────────────

    /// Admin: configure optional minimum reputation required to stage a community.
    pub fn set_community_min_rep(&mut self, min_reputation: u32) {
        require_admin(&self.config.admin.clone());
        require!(min_reputation <= REP_MAX_SCORE, "InvalidReputationThreshold");
        self.community_min_rep = min_reputation;
    }

    pub fn get_reputation(&self, account: AccountId) -> RepView {
        let rep = self.reputation.get(&account).unwrap_or_default();
        let b = compute_rep_breakdown(&account, &rep, now_sec());
        RepView {
            account,
            score: b.score,
            updated_ts: rep.updated_ts,
            contributions_ok: b.contributions_ok,
            contributions_missed: b.contributions_missed,
            circles_completed: b.circles_completed,
            tenure_days: b.tenure_days,
            vault_withdraw_units: b.vault_withdraw_units,
            community_volume: b.community_volume,
        }
    }

    pub fn get_reputation_breakdown(&self, account: AccountId) -> RepBreakdownView {
        let rep = self.reputation.get(&account).unwrap_or_default();
        compute_rep_breakdown(&account, &rep, now_sec())
    }

    // ─── Phase 3: Programmable Rewards ───────────────────────────────────────

    /// Sputnik DAO `Call`: register an automatic reward rule funded from `source_envelope`.
    pub fn create_reward_rule(
        &mut self,
        community_id: u64,
        source_envelope: u64,
        circle_code: Option<u64>,
        trigger: RewardTrigger,
        amount: u64,
    ) -> u64 {
        let caller = env::predecessor_account_id();
        let community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(amount > 0, "InvalidAmount");

        let env_ok = community
            .envelopes
            .iter()
            .any(|e| e.id == source_envelope && e.active);
        require!(env_ok, "EnvelopeInactive");

        if let Some(code) = circle_code {
            require!(self.circles.get(&code).is_some(), "CircleNotFound");
        }
        if let RewardTrigger::Streak { min_contributions } = trigger {
            require!(min_contributions > 0, "InvalidTrigger");
        }

        let mut comm_rules = self
            .community_reward_rules
            .get(&community_id)
            .unwrap_or_default();
        require!(comm_rules.len() < MAX_REWARD_RULES, "TooManyRewardRules");

        let rule_id = self.reward_rule_count;
        self.reward_rule_count = checked_add(self.reward_rule_count, 1);

        let rule = RewardRule {
            id: rule_id,
            community_id,
            source_envelope,
            circle_code,
            trigger,
            amount,
            active: true,
            total_paid: 0,
            payouts_count: 0,
        };
        self.reward_rules.insert(&rule_id, &rule);

        comm_rules.push(rule_id);
        self.community_reward_rules
            .insert(&community_id, &comm_rules);

        if let Some(code) = circle_code {
            let mut circle_rules = self.circle_reward_rules.get(&code).unwrap_or_default();
            circle_rules.push(rule_id);
            self.circle_reward_rules.insert(&code, &circle_rules);
        }

        events::reward_rule_created(rule_id, community_id, source_envelope, circle_code, amount);
        rule_id
    }

    /// Sputnik DAO `Call`: enable or disable an existing reward rule.
    pub fn toggle_reward_rule(&mut self, community_id: u64, rule_id: u64, active: bool) {
        let caller = env::predecessor_account_id();
        let community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");
        require!(caller == community.dao_id, "Unauthorized");

        let mut rule = self.reward_rules.get(&rule_id).expect("RewardRuleNotFound");
        require!(rule.community_id == community_id, "Unauthorized");
        if active {
            require!(!community.dissolved, "CommunityDissolved");
        }
        rule.active = active;
        self.reward_rules.insert(&rule_id, &rule);

        events::reward_rule_toggled(rule_id, community_id, active);
    }

    /// Callback for automatic reward `ft_transfer`.
    pub fn on_reward_transfer(&mut self, pending_id: u64) {
        require_callback();
        let pending = match self.reward_pending.get(&pending_id) {
            Some(p) => p,
            None => return,
        };

        if promise_succeeded() {
            events::reward_paid(
                pending.rule_id,
                pending.community_id,
                pending.envelope_id,
                &pending.recipient,
                pending.amount,
            );
            self.push_activity(
                &pending.recipient,
                "reward",
                None,
                Some(pending.community_id),
                pending.amount,
                None,
            );
        } else {
            // Rollback envelope debit, rule counters, and claim reservation.
            if let Some(mut community) = self.communities.get(&pending.community_id) {
                if let Some(env_item) = community
                    .envelopes
                    .iter_mut()
                    .find(|e| e.id == pending.envelope_id)
                {
                    env_item.spent = checked_sub(env_item.spent, pending.amount);
                }
                self.communities.insert(&pending.community_id, &community);
            }
            if let Some(mut rule) = self.reward_rules.get(&pending.rule_id) {
                rule.total_paid = checked_sub(rule.total_paid, pending.amount);
                rule.payouts_count = rule.payouts_count.saturating_sub(1);
                self.reward_rules.insert(&pending.rule_id, &rule);
            }
            self.rewards_claimed
                .remove(&(pending.rule_id, pending.recipient.clone(), pending.event_key));
            env::log_str(&format!(
                "RodaError:RewardTransferFailed:{}:{}",
                pending.rule_id, pending.community_id
            ));
        }

        self.reward_pending.remove(&pending_id);
    }

    pub fn get_reward_rules(&self, community_id: u64) -> Vec<RewardRuleView> {
        self.community_reward_rules
            .get(&community_id)
            .unwrap_or_default()
            .into_iter()
            .filter_map(|id| self.reward_rules.get(&id))
            .map(|r| RewardRuleView::from(&r))
            .collect()
    }

    // ─── Phase 4: Collective Ownership ───────────────────────────────────────

    /// Sputnik DAO `Call`: mint community ownership shares to `recipient`,
    /// optionally gated by `min_reputation`.
    pub fn grant_shares(
        &mut self,
        community_id: u64,
        recipient: AccountId,
        amount: u64,
        min_reputation: Option<u32>,
    ) {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(amount > 0, "InvalidAmount");

        if let Some(min_rep) = min_reputation {
            if min_rep > 0 {
                require!(
                    self.effective_reputation_score(&recipient) >= min_rep,
                    "InsufficientReputation"
                );
            }
        }

        self.mint_community_shares(&mut community, &recipient, amount, true);
        self.communities.insert(&community_id, &community);
    }

    /// Sputnik DAO `Call`: dissolve a community once all envelopes are closed,
    /// freezing `pool_unallocated` into `dissolve_surplus` for pro-rata member claims.
    pub fn dissolve_community(&mut self, community_id: u64) {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(
            community.envelopes.iter().all(|e| !e.active),
            "ActiveEnvelopesRemaining"
        );

        community.dissolved = true;
        community.dissolve_surplus = community.pool_unallocated;
        let total_shares = community.total_shares;
        let surplus = community.dissolve_surplus;
        self.communities.insert(&community_id, &community);

        // Disable all reward rules attached to this community.
        for rule_id in self
            .community_reward_rules
            .get(&community_id)
            .unwrap_or_default()
        {
            if let Some(mut rule) = self.reward_rules.get(&rule_id) {
                if rule.active {
                    rule.active = false;
                    self.reward_rules.insert(&rule_id, &rule);
                }
            }
        }

        events::community_dissolved(community_id, &caller, surplus, total_shares);
    }

    /// Shareholder: claim pro-rata share of `dissolve_surplus` once community is dissolved.
    pub fn claim_surplus(&mut self, community_id: u64) -> Promise {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(community.dissolved, "CommunityNotDissolved");
        require!(community.total_shares > 0, "NoSharesToClaim");
        require!(community.dissolve_surplus > 0, "NoSurplusToClaim");
        require!(
            self.surplus_claimed
                .get(&(community_id, caller.clone()))
                .is_none(),
            "SurplusAlreadyClaimed"
        );

        let user_shares = self
            .community_shares
            .get(&(community_id, caller.clone()))
            .unwrap_or(0);
        require!(user_shares > 0, "NoSharesToClaim");

        let payout = compute_pro_rata_surplus(
            community.dissolve_surplus,
            user_shares,
            community.total_shares,
        );
        require!(payout > 0, "NoSurplusToClaim");
        require!(community.pool_unallocated >= payout, "InsufficientPool");

        community.pool_unallocated = checked_sub(community.pool_unallocated, payout);
        self.communities.insert(&community_id, &community);
        self.surplus_claimed
            .insert(&(community_id, caller.clone()), &true);

        let token = self.config.token_id.clone();
        ft_transfer_promise(&token, &caller, payout).then(
            Promise::new(env::current_account_id()).function_call(
                "on_claim_surplus".to_string(),
                serde_json::json!({
                    "community_id": community_id,
                    "account": caller,
                    "amount": payout,
                    "shares": user_shares,
                })
                .to_string(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(GAS_CALLBACK),
            ),
        )
    }

    pub fn on_claim_surplus(
        &mut self,
        community_id: u64,
        account: AccountId,
        amount: u64,
        shares: u64,
    ) {
        require_callback();
        if promise_succeeded() {
            events::surplus_claimed(community_id, &account, amount, shares);
            self.push_activity(
                &account,
                "surplus_claimed",
                None,
                Some(community_id),
                amount,
                None,
            );
        } else {
            self.surplus_claimed.remove(&(community_id, account));
            if let Some(mut community) = self.communities.get(&community_id) {
                community.pool_unallocated = checked_add(community.pool_unallocated, amount);
                self.communities.insert(&community_id, &community);
            }
            env::log_str(&format!("RodaError:SurplusClaimFailed:{}", community_id));
        }
    }

    // ─── Community & Share Views ─────────────────────────────────────────────

    pub fn get_community(&self, community_id: u64) -> Option<CommunityView> {
        self.communities
            .get(&community_id)
            .as_ref()
            .map(CommunityView::from)
    }

    pub fn get_community_by_dao(&self, dao_id: AccountId) -> Option<CommunityView> {
        let id = self.dao_communities.get(&dao_id)?;
        self.communities.get(&id).as_ref().map(CommunityView::from)
    }

    pub fn get_communities(&self, community_ids: Vec<u64>) -> Vec<CommunityView> {
        community_ids
            .into_iter()
            .filter_map(|id| self.communities.get(&id))
            .map(|c| CommunityView::from(&c))
            .collect()
    }

    pub fn get_user_community_ids(&self, account: AccountId) -> Vec<u64> {
        self.user_communities.get(&account).unwrap_or_default()
    }

    pub fn get_user_communities(&self, account: AccountId) -> Vec<CommunityView> {
        self.user_communities
            .get(&account)
            .unwrap_or_default()
            .into_iter()
            .filter_map(|id| self.communities.get(&id))
            .map(|c| CommunityView::from(&c))
            .collect()
    }

    pub fn get_envelopes(&self, community_id: u64) -> Vec<EnvelopeView> {
        self.communities
            .get(&community_id)
            .map(|c| c.envelopes.iter().map(EnvelopeView::from).collect())
            .unwrap_or_default()
    }

    pub fn get_community_shares(&self, community_id: u64, account: AccountId) -> u64 {
        self.community_shares
            .get(&(community_id, account))
            .unwrap_or(0)
    }

    pub fn get_community_total_shares(&self, community_id: u64) -> u64 {
        self.communities
            .get(&community_id)
            .map(|c| c.total_shares)
            .unwrap_or(0)
    }

    pub fn get_community_shareholders(&self, community_id: u64) -> Vec<ShareholderView> {
        self.community_shareholders
            .get(&community_id)
            .unwrap_or_default()
            .into_iter()
            .filter_map(|account| {
                let shares = self
                    .community_shares
                    .get(&(community_id, account.clone()))
                    .unwrap_or(0);
                if shares > 0 {
                    Some(ShareholderView { account, shares })
                } else {
                    None
                }
            })
            .collect()
    }

    pub fn has_claimed_surplus(&self, community_id: u64, account: AccountId) -> bool {
        self.surplus_claimed
            .get(&(community_id, account))
            .unwrap_or(false)
    }

    pub fn preview_surplus_claim(&self, community_id: u64, account: AccountId) -> u64 {
        let Some(community) = self.communities.get(&community_id) else {
            return 0;
        };
        if !community.dissolved || self.surplus_claimed.get(&(community_id, account.clone())).unwrap_or(false) {
            return 0;
        }
        let user_shares = self.community_shares.get(&(community_id, account)).unwrap_or(0);
        compute_pro_rata_surplus(community.dissolve_surplus, user_shares, community.total_shares)
    }
}

// ─── Internal Helpers (crate-visible) ─────────────────────────────────────────

impl RodaContract {
    fn allocate_internal(&mut self, community_id: u64, envelope_id: u64, amount: u64) {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(amount > 0, "InvalidAmount");
        require!(community.pool_unallocated >= amount, "InsufficientPool");

        let env_item = community
            .envelopes
            .iter_mut()
            .find(|e| e.id == envelope_id)
            .expect("EnvelopeNotFound");
        require!(env_item.active, "EnvelopeInactive");

        community.pool_unallocated = checked_sub(community.pool_unallocated, amount);
        env_item.allocated = checked_add(env_item.allocated, amount);
        let new_allocated = env_item.allocated;
        let new_pool = community.pool_unallocated;

        self.communities.insert(&community_id, &community);
        events::envelope_allocate(community_id, envelope_id, amount, new_allocated, new_pool);
    }

    fn spend_internal(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        recipient: AccountId,
        amount: u64,
    ) -> Promise {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(amount > 0, "InvalidAmount");
        require!(
            self.spend_pending.get(&(community_id, envelope_id)).is_none(),
            "PendingTransfer"
        );

        let env_item = community
            .envelopes
            .iter_mut()
            .find(|e| e.id == envelope_id)
            .expect("EnvelopeNotFound");
        require!(env_item.active, "EnvelopeInactive");
        require!(env_item.remaining() >= amount, "ExceedsEnvelope");

        env_item.spent = checked_add(env_item.spent, amount);
        self.communities.insert(&community_id, &community);

        self.spend_pending.insert(
            &(community_id, envelope_id),
            &SpendPending {
                community_id,
                envelope_id,
                recipient: recipient.clone(),
                amount,
            },
        );

        let token = self.config.token_id.clone();
        ft_transfer_promise(&token, &recipient, amount).then(
            Promise::new(env::current_account_id()).function_call(
                "on_spend".to_string(),
                serde_json::json!({
                    "community_id": community_id,
                    "envelope_id": envelope_id,
                })
                .to_string(),
                NearToken::from_yoctonear(0),
                Gas::from_gas(GAS_CALLBACK),
            ),
        )
    }

    fn add_envelope_internal(&mut self, community_id: u64, name: String) -> u64 {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(community.envelopes.len() < MAX_ENVELOPES, "TooManyEnvelopes");

        let trimmed = name.trim().to_string();
        let len = trimmed.chars().count();
        require!(
            len >= ENVELOPE_NAME_MIN && len <= ENVELOPE_NAME_MAX,
            "InvalidEnvelopeName"
        );

        let next_id = community
            .envelopes
            .iter()
            .map(|e| e.id)
            .max()
            .map(|m| m + 1)
            .unwrap_or(0);

        community.envelopes.push(Envelope {
            id: next_id,
            name: trimmed.clone(),
            allocated: 0,
            spent: 0,
            active: true,
        });
        self.communities.insert(&community_id, &community);

        events::envelope_updated(community_id, next_id, &trimmed, true);
        next_id
    }

    fn set_envelope_internal(
        &mut self,
        community_id: u64,
        envelope_id: u64,
        name: Option<String>,
        active: Option<bool>,
    ) {
        let caller = env::predecessor_account_id();
        let mut community = self
            .communities
            .get(&community_id)
            .expect("CommunityNotFound");

        require!(caller == community.dao_id, "Unauthorized");
        require!(community.linked, "CommunityNotLinked");
        require!(!community.dissolved, "CommunityDissolved");
        require!(
            self.spend_pending.get(&(community_id, envelope_id)).is_none(),
            "PendingTransfer"
        );

        let idx = community
            .envelopes
            .iter()
            .position(|e| e.id == envelope_id)
            .expect("EnvelopeNotFound");

        if let Some(new_name) = name {
            let trimmed = new_name.trim().to_string();
            let len = trimmed.chars().count();
            require!(
                len >= ENVELOPE_NAME_MIN && len <= ENVELOPE_NAME_MAX,
                "InvalidEnvelopeName"
            );
            community.envelopes[idx].name = trimmed;
        }

        if let Some(next_active) = active {
            if community.envelopes[idx].active && !next_active {
                // Closing an envelope unlocks remaining unspent budget back into pool_unallocated.
                let unspent = community.envelopes[idx].remaining();
                if unspent > 0 {
                    community.pool_unallocated =
                        checked_add(community.pool_unallocated, unspent);
                    community.envelopes[idx].allocated = community.envelopes[idx].spent;
                }
            }
            community.envelopes[idx].active = next_active;
        }

        let updated_name = community.envelopes[idx].name.clone();
        let updated_active = community.envelopes[idx].active;
        self.communities.insert(&community_id, &community);

        events::envelope_updated(community_id, envelope_id, &updated_name, updated_active);
    }

    pub(crate) fn mint_community_shares(
        &mut self,
        community: &mut Community,
        account: &AccountId,
        amount: u64,
        is_grant: bool,
    ) {
        let minted = amount
            .checked_mul(SHARES_PER_USDC_UNIT)
            .expect("MathOverflow");
        if minted == 0 {
            return;
        }
        let cid = community.id;
        let prev = self
            .community_shares
            .get(&(cid, account.clone()))
            .unwrap_or(0);
        let next = checked_add(prev, minted);

        if prev == 0 {
            let mut holders = self.community_shareholders.get(&cid).unwrap_or_default();
            if !holders.contains(account) {
                holders.push(account.clone());
                self.community_shareholders.insert(&cid, &holders);
            }
        }

        self.community_shares.insert(&(cid, account.clone()), &next);
        community.total_shares = checked_add(community.total_shares, minted);

        // Index membership in user_communities so dashboard discovers communities contributed to.
        let mut uc = self.user_communities.get(account).unwrap_or_default();
        if !uc.contains(&cid) {
            uc.push(cid);
            self.user_communities.insert(account, &uc);
        }

        if is_grant {
            events::shares_granted(cid, account, minted, next, community.total_shares);
        } else {
            events::shares_minted(cid, account, minted, next, community.total_shares);
        }
    }

    pub(crate) fn effective_reputation_score(&self, account: &AccountId) -> u32 {
        let rep = self.reputation.get(account).unwrap_or_default();
        compute_rep_breakdown(account, &rep, now_sec()).score
    }

    pub(crate) fn touch_rep_seen(&mut self, account: &AccountId) {
        if self.reputation.get(account).is_none() {
            let now = now_sec();
            self.reputation.insert(
                account,
                &RepScore {
                    first_seen_ts: now,
                    updated_ts: now,
                    ..Default::default()
                },
            );
        }
    }

    fn save_reputation(&mut self, account: &AccountId, mut rep: RepScore, now: i64) {
        if rep.first_seen_ts == 0 {
            rep.first_seen_ts = now;
        }
        let breakdown = compute_rep_breakdown(account, &rep, now);
        rep.tenure_days = breakdown.tenure_days;
        rep.score = breakdown.score;
        rep.updated_ts = now;
        self.reputation.insert(account, &rep);
        events::reputation_updated(account, rep.score);
    }

    pub(crate) fn record_rep_contribution(&mut self, account: &AccountId, late: bool) {
        let now = now_sec();
        let mut rep = self.reputation.get(account).unwrap_or_default();
        rep.contributions_ok = rep.contributions_ok.saturating_add(1);
        if late {
            rep.contributions_missed = rep.contributions_missed.saturating_add(1);
        }
        self.save_reputation(account, rep, now);
    }

    pub(crate) fn record_rep_circle_completed(&mut self, account: &AccountId) {
        let now = now_sec();
        let mut rep = self.reputation.get(account).unwrap_or_default();
        rep.circles_completed = rep.circles_completed.saturating_add(1);
        self.save_reputation(account, rep, now);
    }

    pub(crate) fn record_rep_vault_withdraw(&mut self, account: &AccountId, units: u32) {
        let now = now_sec();
        let mut rep = self.reputation.get(account).unwrap_or_default();
        rep.vault_withdraw_units = rep.vault_withdraw_units.saturating_add(units);
        self.save_reputation(account, rep, now);
    }

    pub(crate) fn record_rep_community_volume(&mut self, account: &AccountId, amount: u64) {
        let now = now_sec();
        let mut rep = self.reputation.get(account).unwrap_or_default();
        rep.community_volume = rep.community_volume.saturating_add(amount);
        self.save_reputation(account, rep, now);
    }

    pub(crate) fn has_reward_rules_for(&self, circle_code: u64, recipient: &AccountId) -> bool {
        if !self
            .circle_reward_rules
            .get(&circle_code)
            .unwrap_or_default()
            .is_empty()
        {
            return true;
        }
        for cid in self.user_communities.get(recipient).unwrap_or_default() {
            if !self
                .community_reward_rules
                .get(&cid)
                .unwrap_or_default()
                .is_empty()
            {
                return true;
            }
        }
        false
    }

    pub(crate) fn schedule_payout_rewards(
        &mut self,
        circle_code: u64,
        recipient: &AccountId,
        paid_round: u16,
        mut available_gas: u64,
    ) -> Vec<Promise> {
        let mut candidate_rule_ids = self
            .circle_reward_rules
            .get(&circle_code)
            .unwrap_or_default();

        for cid in self.user_communities.get(recipient).unwrap_or_default() {
            for rid in self.community_reward_rules.get(&cid).unwrap_or_default() {
                if !candidate_rule_ids.contains(&rid) {
                    if let Some(rule) = self.reward_rules.get(&rid) {
                        if rule.circle_code.is_none() {
                            candidate_rule_ids.push(rid);
                        }
                    }
                }
            }
        }

        if candidate_rule_ids.is_empty() {
            return Vec::new();
        }

        let rep = self.reputation.get(recipient).unwrap_or_default();
        let min_item_gas = GAS_REWARD_TRANSFER + GAS_REWARD_CALLBACK + 5_000_000_000_000;
        let mut promises = Vec::new();

        for rule_id in candidate_rule_ids {
            if promises.len() >= MAX_AUTO_REWARDS_PER_PAYOUT || available_gas < min_item_gas {
                break;
            }
            let Some(mut rule) = self.reward_rules.get(&rule_id) else {
                continue;
            };
            if !rule.active || rule.amount == 0 {
                continue;
            }
            if let Some(scoped) = rule.circle_code {
                if scoped != circle_code {
                    continue;
                }
            }

            let event_key = match rule.trigger {
                RewardTrigger::CircleRoundCompleted => {
                    ((circle_code) << 16) | (paid_round as u64)
                }
                RewardTrigger::Streak { min_contributions } => {
                    if rep.contributions_ok < min_contributions {
                        continue;
                    }
                    0
                }
            };

            if self
                .rewards_claimed
                .get(&(rule_id, recipient.clone(), event_key))
                .unwrap_or(false)
            {
                continue;
            }

            let Some(mut community) = self.communities.get(&rule.community_id) else {
                continue;
            };
            if !community.linked || community.dissolved {
                continue;
            }
            if self
                .spend_pending
                .get(&(rule.community_id, rule.source_envelope))
                .is_some()
            {
                continue;
            }

            let Some(env_idx) = community
                .envelopes
                .iter()
                .position(|e| e.id == rule.source_envelope)
            else {
                continue;
            };
            if !community.envelopes[env_idx].active
                || community.envelopes[env_idx].remaining() < rule.amount
            {
                continue;
            }

            // Optimistic debit on envelope & reserve claim slot.
            community.envelopes[env_idx].spent =
                checked_add(community.envelopes[env_idx].spent, rule.amount);
            self.communities.insert(&rule.community_id, &community);

            rule.total_paid = checked_add(rule.total_paid, rule.amount);
            rule.payouts_count = rule.payouts_count.saturating_add(1);
            self.reward_rules.insert(&rule_id, &rule);

            self.rewards_claimed
                .insert(&(rule_id, recipient.clone(), event_key), &true);

            let pending_id = self.reward_pending_count;
            self.reward_pending_count = checked_add(self.reward_pending_count, 1);
            self.reward_pending.insert(
                &pending_id,
                &RewardPending {
                    rule_id,
                    community_id: rule.community_id,
                    envelope_id: rule.source_envelope,
                    recipient: recipient.clone(),
                    amount: rule.amount,
                    event_key,
                },
            );

            available_gas = available_gas.saturating_sub(min_item_gas);
            let token = self.config.token_id.clone();
            let p = ft_transfer_promise(&token, recipient, rule.amount).then(
                Promise::new(env::current_account_id()).function_call(
                    "on_reward_transfer".to_string(),
                    serde_json::json!({ "pending_id": pending_id }).to_string(),
                    NearToken::from_yoctonear(0),
                    Gas::from_gas(GAS_REWARD_CALLBACK),
                ),
            );
            promises.push(p);
        }

        promises
    }
}
