use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(use_discriminant = true)]
pub enum IndexKind {
    StakePoolRate = 0,
    ScaledUiDividendAdjusted = 1,
    OracleIndex = 2,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(use_discriminant = true)]
pub enum SeriesStatus {
    Open = 0,
    Settled = 1,
    Disputed = 2,
    Paused = 3,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(use_discriminant = true)]
pub enum PrivacyMode {
    Plain = 0,
    Confidential = 1,
}

#[account]
#[derive(Default, Debug)]
pub struct Series {
    /// Collateral token mint (Token or Token-2022)
    pub collateral_mint: Pubkey,
    /// Token program owning the collateral mint (Token or Token-2022)
    pub collateral_program: Pubkey,
    /// Denominated quote currency mint (e.g. wSOL for staking, USDC for equities)
    pub quote_mint: Pubkey,
    /// Yield index type: 0 = StakePoolRate, 1 = ScaledUiDividendAdjusted, 2 = OracleIndex
    pub index_kind: u8,
    /// Source account or pubkey for the index (e.g. stake pool account or price feed)
    pub index_source: Pubkey,
    /// Index value at series opening, scaled by WAD (1e18)
    pub idx_open: u128,
    /// Unix timestamp when the series was created
    pub open_ts: i64,
    /// Unix timestamp when the series reaches maturity
    pub maturity_ts: i64,
    /// Principal Token (PT) Token-2022 mint address
    pub pt_mint: Pubkey,
    /// Yield Token (YT) Token-2022 mint address
    pub yt_mint: Pubkey,
    /// Vault account (ATA) owned by this Series PDA holding raw collateral
    pub vault: Pubkey,
    /// Current lifecycle status: 0 = Open, 1 = Settled, 2 = Disputed, 3 = Paused
    pub status: u8,
    /// Settled index value scaled by WAD (1e18)
    pub idx_settle: u128,
    /// Cumulative corporate split factor numerator (1 if no split)
    pub split_num: u32,
    /// Cumulative corporate split factor denominator (1 if no split)
    pub split_den: u32,
    /// Unix timestamp when settlement occurred
    pub settled_ts: i64,
    /// Privacy mode: 0 = Plain, 1 = Confidential (immutable)
    pub privacy_mode: u8,
    /// Maximum allowable annualized rate in basis points (sanity cap)
    pub max_rate_bps: u32,
    /// Maximum allowable dividend increase in basis points (sanity cap for equities)
    pub dividend_cap_bps: u32,
    /// Nonce to allow distinct series with the same collateral and maturity
    pub nonce: u16,
    /// PDA bump seed
    pub bump: u8,
}

impl Series {
    pub const SEED: &'static [u8] = b"series";
    // 8 + 32 + 32 + 32 + 1 + 32 + 16 + 8 + 8 + 32 + 32 + 32 + 1 + 16 + 4 + 4 + 8 + 1 + 4 + 4 + 2 + 1 + 32 (padding) = 374
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 32 + 16 + 8 + 8 + 32 + 32 + 32 + 1 + 16 + 4 + 4 + 8 + 1 + 4 + 4 + 2 + 1 + 32;
}
