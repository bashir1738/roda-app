// ─── Token ────────────────────────────────────────────────────────────────────

/// USDC-style token decimals used by the configured NEP-141 token.
#[allow(dead_code)]
pub const TOKEN_DECIMALS: u8 = 6;

// ─── Circle rules ─────────────────────────────────────────────────────────────

/// Maximum members per circle.
pub const MAX_CIRCLE_MEMBERS: u8 = 12;

/// Minimum members per circle.
pub const MIN_CIRCLE_MEMBERS: u8 = 2;

/// Minimum circle name length (chars).
pub const CIRCLE_NAME_MIN: usize = 3;

/// Maximum circle name length (chars).
pub const CIRCLE_NAME_MAX: usize = 32;

/// Minimum allowed round frequency (seconds).
pub const MIN_FREQUENCY_SECS: u64 = 60;

/// Smallest valid circle code (6 digits, no leading zero).
pub const CIRCLE_CODE_MIN: u64 = 100_000;

/// Largest valid circle code (6 digits).
pub const CIRCLE_CODE_MAX: u64 = 999_999;

// ─── Username rules ───────────────────────────────────────────────────────────

/// Minimum username length (bytes).
pub const USERNAME_MIN: usize = 3;

/// Maximum username length (bytes).
pub const USERNAME_MAX: usize = 20;

/// Cooldown between username changes (seconds).
pub const NAME_COOLDOWN_SECS: i64 = 24 * 60 * 60;

// ─── Faucet ───────────────────────────────────────────────────────────────────

/// Token units per faucet claim (6 decimals → 1,000 tokens).
pub const FAUCET_AMOUNT: u64 = 1_000_000_000;

/// Cooldown between faucet claims (seconds).
pub const FAUCET_COOLDOWN_SECS: i64 = 24 * 60 * 60;

// ─── Protocol fee ─────────────────────────────────────────────────────────────

/// Protocol fee in basis-point-ish milli-units: 3/1000 = 0.3%.
pub const FEE_NUMERATOR: u64 = 3;
pub const FEE_DENOMINATOR: u64 = 1_000;

// ─── Activity log ─────────────────────────────────────────────────────────────

/// Maximum activity items retained per account.
pub const ACTIVITY_MAX: usize = 50;

// ─── Gas ──────────────────────────────────────────────────────────────────────

pub const GAS_FT_TRANSFER: u64 = 30_000_000_000_000; // 30 TGas
pub const GAS_CALLBACK: u64 = 25_000_000_000_000; // 25 TGas
pub const GAS_CALLBACK_WITH_FEE: u64 = 65_000_000_000_000; // 65 TGas (on_payout + ft_transfer fee + on_fee)
pub const GAS_PAYOUT_CALLBACK: u64 = 150_000_000_000_000; // 150 TGas (on_payout + fee + auto-rewards)
pub const GAS_REWARD_TRANSFER: u64 = 30_000_000_000_000; // 30 TGas
pub const GAS_REWARD_CALLBACK: u64 = 25_000_000_000_000; // 25 TGas
pub const GAS_FT_MINT: u64 = 50_000_000_000_000; // 50 TGas
pub const GAS_MIGRATE: u64 = 40_000_000_000_000; // 40 TGas

// ─── Community coordination & budgets (Phase 1) ───────────────────────────────

/// Maximum budget envelopes allowed per community.
pub const MAX_ENVELOPES: usize = 12;

/// Maximum communities a single account may create/join via primary index.
pub const MAX_COMMUNITIES_PER_USER: usize = 10;

/// Minimum community display name length (chars).
pub const COMMUNITY_NAME_MIN: usize = 3;

/// Maximum community display name length (chars).
pub const COMMUNITY_NAME_MAX: usize = 48;

/// Minimum envelope label length (chars).
pub const ENVELOPE_NAME_MIN: usize = 2;

/// Maximum envelope label length (chars).
pub const ENVELOPE_NAME_MAX: usize = 32;

// ─── On-chain reputation scoring (Phase 2) ────────────────────────────────────
//
// Sybil-resistance invariant: reputation weights real USDC capital at risk
// (completed circle contributions, matured vaults, and escrow contributions)
// and calendar tenure rather than empty account creation.

/// Upper bound of the normalized Roda reputation score.
pub const REP_MAX_SCORE: u32 = 1_000;
pub const REP_POINTS_CONTRIBUTION: u32 = 25;
pub const REP_CAP_CONTRIBUTION: u32 = 350;
pub const REP_POINTS_CIRCLE_COMPLETE: u32 = 50;
pub const REP_CAP_CIRCLE_COMPLETE: u32 = 250;
pub const REP_POINTS_VAULT_UNIT: u32 = 15;
pub const REP_CAP_VAULT: u32 = 150;
/// 10 USDC (in 6-decimal base units) per community volume point step.
pub const REP_VOLUME_STEP_USDC: u64 = 10_000_000;
pub const REP_POINTS_VOLUME_STEP: u32 = 5;
pub const REP_CAP_VOLUME: u32 = 150;
pub const REP_TENURE_DAYS_PER_POINT: u32 = 3;
pub const REP_CAP_TENURE: u32 = 100;
pub const REP_PENALTY_MISSED: u32 = 40;
pub const SECS_PER_DAY: i64 = 86_400;

// ─── Programmable rewards (Phase 3) ───────────────────────────────────────────

/// Maximum reward rules per community.
pub const MAX_REWARD_RULES: usize = 16;

/// Cap concurrent automatic reward transfers dispatched per circle payout.
pub const MAX_AUTO_REWARDS_PER_PAYOUT: usize = 3;

// ─── Collective ownership (Phase 4) ───────────────────────────────────────────

/// Mint 1 share unit per 1 micro-USDC funded to community escrow (exact u64, no rounding loss).
/// 1,000,000 share units = 1.00 USDC-equivalent voting/surplus share.
pub const SHARES_PER_USDC_UNIT: u64 = 1;

