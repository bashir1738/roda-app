use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::collections::LookupMap;
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, BorshStorageKey};

/// Storage prefixes for all contract collections.
/// NOTE: Preserve enum order — variants 0..9 match existing V1 deployment storage keys.
#[derive(BorshStorageKey, BorshSerialize)]
pub enum StorageKey {
    Vaults,
    UserVaults,
    Circles,
    UserCircles,
    Names,
    Profiles,
    Faucet,
    Activity,
    PayoutPending,
    WithdrawPending,
    Communities,
    UserCommunities,
    DaoCommunities,
    SpendPending,
    Reputation,
    RewardRules,
    CommunityRewardRules,
    CircleRewardRules,
    RewardsClaimed,
    RewardPending,
    CommunityShares,
    CommunityShareholders,
    SurplusClaimed,
}

/// Global Roda configuration — stored inline on the contract.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Config {
    /// Admin who initialized the config (receives the protocol fee).
    pub admin: AccountId,
    /// NEP-141 fungible token contract all balances use (USDC on mainnet).
    pub token_id: AccountId,
    /// Auto-incrementing vault ID counter.
    pub vault_count: u64,
    /// Number of circles created so far.
    pub circle_count: u64,
    /// Whether the faucet method is enabled (test token only).
    pub faucet_enabled: bool,
}

/// Savings vault tier (mirrors the original Anchor enum).
#[derive(BorshDeserialize, BorshSerialize, Clone, Copy, PartialEq, Eq, Debug)]
#[borsh(use_discriminant = true)]
pub enum VaultTier {
    Flex = 0,
    Weekly = 1,
    Monthly = 2,
    SixMonths = 3,
    OneYear = 4,
}

impl VaultTier {
    pub fn from_u8(v: u8) -> Option<VaultTier> {
        match v {
            0 => Some(VaultTier::Flex),
            1 => Some(VaultTier::Weekly),
            2 => Some(VaultTier::Monthly),
            3 => Some(VaultTier::SixMonths),
            4 => Some(VaultTier::OneYear),
            _ => None,
        }
    }

    /// Minimum deposit in token units (6 decimals).
    pub fn min_deposit(&self) -> u64 {
        match self {
            VaultTier::Flex => 0,
            VaultTier::Weekly => 10_000_000,     // 10
            VaultTier::Monthly => 50_000_000,    // 50
            VaultTier::SixMonths => 100_000_000, // 100
            VaultTier::OneYear => 250_000_000,   // 250
        }
    }

    /// Lock duration in seconds (0 = no lock).
    pub fn lock_duration_secs(&self) -> i64 {
        match self {
            VaultTier::Flex => 0,
            VaultTier::Weekly => 7 * 24 * 60 * 60,
            VaultTier::Monthly => 30 * 24 * 60 * 60,
            VaultTier::SixMonths => 182 * 24 * 60 * 60,
            VaultTier::OneYear => 365 * 24 * 60 * 60,
        }
    }
}

/// Individual user savings vault.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Vault {
    pub owner: AccountId,
    pub vault_id: u64,
    pub tier: u8,
    pub balance: u64,
    pub last_deposit_ts: i64,
    pub maturity_ts: i64,
    pub active: bool,
}

/// Lifecycle state of a rotating savings circle.
#[derive(BorshDeserialize, BorshSerialize, Clone, Copy, PartialEq, Eq, Debug)]
#[borsh(use_discriminant = true)]
pub enum CircleStatus {
    Active = 0,
    Completed = 1,
}

/// Rotating savings (ajo/esusu) circle.
#[derive(Clone)]
pub struct Circle {
    pub id: u64,
    pub creator: AccountId,
    pub name: String,
    pub max_members: u8,
    pub contribution_amount: u64,
    pub frequency_secs: u64,
    pub current_round: u16,
    pub pool_balance: u64,
    pub round_started_ts: i64,
    pub status: CircleStatus,
    /// Member accounts in join order; round R pays members[R % members.len()].
    pub members: Vec<AccountId>,
    /// Accounts that paid for the current round.
    pub paid: Vec<AccountId>,
    /// Locked while the round payout transfer chain is in flight.
    pub payout_pending: bool,
    /// Phase 2: minimum on-chain reputation score required to join (0 = open).
    pub min_reputation: u32,
}

impl BorshSerialize for Circle {
    fn serialize<W: borsh::io::Write>(&self, writer: &mut W) -> borsh::io::Result<()> {
        BorshSerialize::serialize(&self.id, writer)?;
        BorshSerialize::serialize(&self.creator, writer)?;
        BorshSerialize::serialize(&self.name, writer)?;
        BorshSerialize::serialize(&self.max_members, writer)?;
        BorshSerialize::serialize(&self.contribution_amount, writer)?;
        BorshSerialize::serialize(&self.frequency_secs, writer)?;
        BorshSerialize::serialize(&self.current_round, writer)?;
        BorshSerialize::serialize(&self.pool_balance, writer)?;
        BorshSerialize::serialize(&self.round_started_ts, writer)?;
        BorshSerialize::serialize(&self.status, writer)?;
        BorshSerialize::serialize(&self.members, writer)?;
        BorshSerialize::serialize(&self.paid, writer)?;
        BorshSerialize::serialize(&self.payout_pending, writer)?;
        BorshSerialize::serialize(&self.min_reputation, writer)?;
        Ok(())
    }
}

impl BorshDeserialize for Circle {
    fn deserialize_reader<R: borsh::io::Read>(reader: &mut R) -> borsh::io::Result<Self> {
        let id = u64::deserialize_reader(reader)?;
        let creator = AccountId::deserialize_reader(reader)?;
        let name = String::deserialize_reader(reader)?;
        let max_members = u8::deserialize_reader(reader)?;
        let contribution_amount = u64::deserialize_reader(reader)?;
        let frequency_secs = u64::deserialize_reader(reader)?;
        let current_round = u16::deserialize_reader(reader)?;
        let pool_balance = u64::deserialize_reader(reader)?;
        let round_started_ts = i64::deserialize_reader(reader)?;
        let status = CircleStatus::deserialize_reader(reader)?;
        let members = Vec::<AccountId>::deserialize_reader(reader)?;
        let paid = Vec::<AccountId>::deserialize_reader(reader)?;
        let payout_pending = bool::deserialize_reader(reader)?;
        let mut rep_buf = [0u8; 4];
        let min_reputation = match reader.read_exact(&mut rep_buf) {
            Ok(()) => u32::from_le_bytes(rep_buf),
            Err(e) if e.kind() == borsh::io::ErrorKind::UnexpectedEof => 0,
            Err(e) => return Err(e),
        };
        Ok(Circle {
            id,
            creator,
            name,
            max_members,
            contribution_amount,
            frequency_secs,
            current_round,
            pool_balance,
            round_started_ts,
            status,
            members,
            paid,
            payout_pending,
            min_reputation,
        })
    }
}

impl Circle {
    pub fn member_count(&self) -> u8 {
        self.members.len() as u8
    }

    pub fn paid_count(&self) -> u8 {
        self.paid.len() as u8
    }
}

/// Per-owner username profile.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct NameProfile {
    /// Current lowercase username ("" when released).
    pub name: String,
    /// Unix seconds of the last claim/release (cooldown gate).
    pub last_change_ts: i64,
}

/// One entry in a user's onchain activity log.
#[derive(BorshDeserialize, BorshSerialize, Clone, Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Activity {
    /// deposit | withdraw | contribute | payout | fee | faucet | vault_created
    /// | circle_created | circle_joined | name_claimed | budget_deposit | reward | surplus_claimed
    pub kind: String,
    pub circle_id: Option<u64>,
    pub vault_id: Option<u64>,
    pub amount: u64,
    pub ts: i64,
    pub peer: Option<AccountId>,
}

/// In-flight circle payout transfer (state is committed only after success).
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct PayoutPending {
    pub fee: u64,
    pub payout: u64,
    pub recipient: AccountId,
    pub paid_round: u16,
    pub pool_balance: u64,
}

/// In-flight vault withdrawal transfer.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct WithdrawPending {
    pub owner: AccountId,
    pub vault_id: u64,
    pub amount: u64,
}

// ─── Phase 1: Community Escrow & Shared Budgets ───────────────────────────────

/// Hard-capped spending envelope inside a community's Roda escrow.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Envelope {
    pub id: u64,
    pub name: String,
    pub allocated: u64,
    pub spent: u64,
    pub active: bool,
}

impl Envelope {
    pub fn remaining(&self) -> u64 {
        self.allocated.saturating_sub(self.spent)
    }
}

/// A Roda community anchored to a Sputnik DAO (`<name>.sputnik-dao.near`).
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct Community {
    pub id: u64,
    pub dao_id: AccountId,
    pub creator: AccountId,
    pub name: String,
    pub created_ts: i64,
    pub envelopes: Vec<Envelope>,
    pub pool_unallocated: u64,
    pub linked: bool,
    /// Phase 4: collective dissolution & ownership tracking.
    pub dissolved: bool,
    pub total_shares: u64,
    pub dissolve_surplus: u64,
}

/// In-flight community envelope spend transfer (for optimistic debit rollback).
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct SpendPending {
    pub community_id: u64,
    pub envelope_id: u64,
    pub recipient: AccountId,
    pub amount: u64,
}

// ─── Phase 2: On-chain Reputation ─────────────────────────────────────────────

/// Persistent reputation counters & cached score for an account.
#[derive(BorshDeserialize, BorshSerialize, Clone, Default)]
pub struct RepScore {
    pub score: u32,
    pub updated_ts: i64,
    pub first_seen_ts: i64,
    pub contributions_ok: u32,
    pub contributions_missed: u32,
    pub circles_completed: u32,
    pub tenure_days: u32,
    pub vault_withdraw_units: u32,
    pub community_volume: u64,
}

// ─── Phase 3: Programmable Rewards ────────────────────────────────────────────

/// Condition triggering an automatic Roda reward payout on circle completion/round.
#[derive(
    BorshDeserialize, BorshSerialize, Clone, Copy, PartialEq, Eq, Debug, Serialize, Deserialize,
)]
#[serde(crate = "near_sdk::serde", tag = "kind", rename_all = "snake_case")]
pub enum RewardTrigger {
    CircleRoundCompleted,
    Streak { min_contributions: u32 },
}

/// DAO-governed automatic reward rule funded out of an escrow envelope.
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct RewardRule {
    pub id: u64,
    pub community_id: u64,
    pub source_envelope: u64,
    pub circle_code: Option<u64>,
    pub trigger: RewardTrigger,
    pub amount: u64,
    pub active: bool,
    pub total_paid: u64,
    pub payouts_count: u64,
}

/// In-flight auto-reward FT transfer (for rollback on failure).
#[derive(BorshDeserialize, BorshSerialize, Clone)]
pub struct RewardPending {
    pub rule_id: u64,
    pub community_id: u64,
    pub envelope_id: u64,
    pub recipient: AccountId,
    pub amount: u64,
    pub event_key: u64,
}

// ─── V1 state layout for backwards-compatible upgrade migration ───────────────

#[derive(BorshDeserialize)]
pub struct RodaContractV1 {
    pub config: Config,
    pub vaults: LookupMap<u64, Vault>,
    pub user_vaults: LookupMap<AccountId, Vec<u64>>,
    pub circles: LookupMap<u64, Circle>,
    pub user_circles: LookupMap<AccountId, Vec<u64>>,
    pub names: LookupMap<String, AccountId>,
    pub profiles: LookupMap<AccountId, NameProfile>,
    pub faucet: LookupMap<AccountId, i64>,
    pub activity: LookupMap<AccountId, Vec<Activity>>,
    pub payout_pending: LookupMap<u64, PayoutPending>,
    pub withdraw_pending: LookupMap<u64, WithdrawPending>,
    pub fees_owed: u64,
}

// ─── JSON views ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ConfigView {
    pub admin: AccountId,
    pub token_id: AccountId,
    pub vault_count: u64,
    pub circle_count: u64,
    pub faucet_enabled: bool,
    pub community_count: u64,
    pub community_min_rep: u32,
    pub reward_rule_count: u64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct VaultView {
    pub owner: AccountId,
    pub vault_id: u64,
    pub tier: u8,
    pub balance: u64,
    pub last_deposit_ts: i64,
    pub maturity_ts: i64,
    pub active: bool,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct CircleView {
    pub id: u64,
    pub creator: AccountId,
    pub name: String,
    pub max_members: u8,
    pub member_count: u8,
    pub paid_count: u8,
    pub contribution_amount: u64,
    pub frequency_secs: u64,
    pub current_round: u16,
    pub pool_balance: u64,
    pub round_started_ts: i64,
    /// "Active" | "Completed"
    pub status: String,
    pub members: Vec<AccountId>,
    pub paid: Vec<AccountId>,
    pub payout_pending: bool,
    pub min_reputation: u32,
}

impl From<&Circle> for CircleView {
    fn from(c: &Circle) -> Self {
        CircleView {
            id: c.id,
            creator: c.creator.clone(),
            name: c.name.clone(),
            max_members: c.max_members,
            member_count: c.member_count(),
            paid_count: c.paid_count(),
            contribution_amount: c.contribution_amount,
            frequency_secs: c.frequency_secs,
            current_round: c.current_round,
            pool_balance: c.pool_balance,
            round_started_ts: c.round_started_ts,
            status: match c.status {
                CircleStatus::Active => "Active".to_string(),
                CircleStatus::Completed => "Completed".to_string(),
            },
            members: c.members.clone(),
            paid: c.paid.clone(),
            payout_pending: c.payout_pending,
            min_reputation: c.min_reputation,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ProfileView {
    pub owner: AccountId,
    pub name: String,
    pub last_change_ts: i64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct EnvelopeView {
    pub id: u64,
    pub name: String,
    pub allocated: u64,
    pub spent: u64,
    pub remaining: u64,
    pub active: bool,
}

impl From<&Envelope> for EnvelopeView {
    fn from(e: &Envelope) -> Self {
        EnvelopeView {
            id: e.id,
            name: e.name.clone(),
            allocated: e.allocated,
            spent: e.spent,
            remaining: e.remaining(),
            active: e.active,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct CommunityView {
    pub id: u64,
    pub dao_id: AccountId,
    pub creator: AccountId,
    pub name: String,
    pub created_ts: i64,
    pub envelopes: Vec<EnvelopeView>,
    pub pool_unallocated: u64,
    pub total_allocated_remaining: u64,
    pub linked: bool,
    pub dissolved: bool,
    pub total_shares: u64,
    pub dissolve_surplus: u64,
}

impl From<&Community> for CommunityView {
    fn from(c: &Community) -> Self {
        let envelopes: Vec<EnvelopeView> = c.envelopes.iter().map(EnvelopeView::from).collect();
        let total_allocated_remaining = envelopes
            .iter()
            .fold(0u64, |acc, e| acc.saturating_add(e.remaining));
        CommunityView {
            id: c.id,
            dao_id: c.dao_id.clone(),
            creator: c.creator.clone(),
            name: c.name.clone(),
            created_ts: c.created_ts,
            envelopes,
            pool_unallocated: c.pool_unallocated,
            total_allocated_remaining,
            linked: c.linked,
            dissolved: c.dissolved,
            total_shares: c.total_shares,
            dissolve_surplus: c.dissolve_surplus,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct RepView {
    pub account: AccountId,
    pub score: u32,
    pub updated_ts: i64,
    pub contributions_ok: u32,
    pub contributions_missed: u32,
    pub circles_completed: u32,
    pub tenure_days: u32,
    pub vault_withdraw_units: u32,
    pub community_volume: u64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct RepBreakdownView {
    pub account: AccountId,
    pub score: u32,
    pub reliability_pts: u32,
    pub completion_pts: u32,
    pub vault_pts: u32,
    pub volume_pts: u32,
    pub tenure_pts: u32,
    pub penalty_pts: u32,
    pub contributions_ok: u32,
    pub contributions_missed: u32,
    pub circles_completed: u32,
    pub tenure_days: u32,
    pub vault_withdraw_units: u32,
    pub community_volume: u64,
    pub sybil_note: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct RewardRuleView {
    pub id: u64,
    pub community_id: u64,
    pub source_envelope: u64,
    pub circle_code: Option<u64>,
    pub trigger: RewardTrigger,
    pub amount: u64,
    pub active: bool,
    pub total_paid: u64,
    pub payouts_count: u64,
}

impl From<&RewardRule> for RewardRuleView {
    fn from(r: &RewardRule) -> Self {
        RewardRuleView {
            id: r.id,
            community_id: r.community_id,
            source_envelope: r.source_envelope,
            circle_code: r.circle_code,
            trigger: r.trigger,
            amount: r.amount,
            active: r.active,
            total_paid: r.total_paid,
            payouts_count: r.payouts_count,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ShareholderView {
    pub account: AccountId,
    pub shares: u64,
}
