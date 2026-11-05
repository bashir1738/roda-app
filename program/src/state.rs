use borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::serde::{Deserialize, Serialize};
use near_sdk::{AccountId, BorshStorageKey};

/// Storage prefixes for all contract collections.
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
#[derive(BorshDeserialize, BorshSerialize, Clone)]
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
    /// | circle_created | circle_joined | name_claimed
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

// ─── JSON views ───────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct ConfigView {
    pub admin: AccountId,
    pub token_id: AccountId,
    pub vault_count: u64,
    pub circle_count: u64,
    pub faucet_enabled: bool,
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
