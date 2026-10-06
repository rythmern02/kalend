use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct RateRecord {
    /// Benchmark identifier (8 bytes, e.g. "SOL-STK1")
    pub benchmark_id: [u8; 8],
    /// Reported rate in basis points (signed, e.g. 750 = 7.50%)
    pub rate_bps: i64,
    /// Observation window end timestamp
    pub window_end: i64,
    /// Timestamp when this record was updated onchain
    pub updated_ts: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl RateRecord {
    pub const SEED: &'static [u8] = b"rate";
    // 8 + 8 + 8 + 8 + 8 + 1 + 16 padding = 57 bytes
    pub const LEN: usize = 8 + 8 + 8 + 8 + 8 + 1 + 16;
}
