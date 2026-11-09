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
pub const GAS_FT_MINT: u64 = 50_000_000_000_000; // 50 TGas
pub const GAS_MIGRATE: u64 = 40_000_000_000_000; // 40 TGas

