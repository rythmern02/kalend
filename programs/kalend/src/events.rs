use anchor_lang::prelude::*;

// ─────────────────────────────────────────────────────────────────────────────
// REPORT PAYLOAD STRUCTS (Referenced by events to ensure emission into the IDL)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct FillReport {
    pub kind: u8,            // 1
    pub version: u8,         // 1
    pub round_id: [u8; 32],
    pub series: Pubkey,
    pub side: u8,            // 0 = SellPT, 1 = SellYT
    pub requester: Pubkey,
    pub dealer: Pubkey,
    pub asset_amount: u64,
    pub quote_amount: u64,
    pub quote_mint: Pubkey,
    pub not_after: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct SettleReport {
    pub kind: u8,            // 2
    pub version: u8,         // 1
    pub series: Pubkey,
    pub observed_ts: i64,
    pub index_wad: u128,
    pub split_num: u32,
    pub split_den: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub struct RateReport {
    pub kind: u8,                // 3
    pub version: u8,             // 1
    pub benchmark_id: [u8; 8],
    pub rate_bps: i64,
    pub window_end: i64,
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE CHANGE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

#[event]
pub struct ConfigInitialized {
    pub authority: Pubkey,
    pub cluster_mode: u8,
}

#[event]
pub struct ForwarderUpdated {
    pub index: u8,
    pub program: Pubkey,
    pub state: Pubkey,
    pub allowed_workflow: [u8; 32],
}

#[event]
pub struct SeriesOpened {
    pub series: Pubkey,
    pub collateral_mint: Pubkey,
    pub quote_mint: Pubkey,
    pub pt_mint: Pubkey,
    pub yt_mint: Pubkey,
    pub open_ts: i64,
    pub maturity_ts: i64,
    pub idx_open: u128,
}

#[event]
pub struct TokensStripped {
    pub series: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TokensMerged {
    pub series: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowLocked {
    pub series: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub lock_until: i64,
}

#[event]
pub struct EscrowWithdrawn {
    pub series: Pubkey,
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ReceivedFillReport {
    pub report: FillReport,
    pub report_hash: [u8; 32],
}

#[event]
pub struct FillExecuted {
    pub round_id: [u8; 32],
    pub series: Pubkey,
    pub requester: Pubkey,
    pub dealer: Pubkey,
    pub asset_amount: u64,
    pub quote_amount: u64,
}

#[event]
pub struct ReceivedSettleReport {
    pub report: SettleReport,
    pub series: Pubkey,
    pub idx_settle: u128,
}

#[event]
pub struct ReceivedRateReport {
    pub report: RateReport,
}

#[event]
pub struct PtRedeemed {
    pub series: Pubkey,
    pub user: Pubkey,
    pub pt_amount: u64,
    pub raw_collateral_received: u64,
}

#[event]
pub struct YtClaimed {
    pub series: Pubkey,
    pub user: Pubkey,
    pub yt_amount: u64,
    pub raw_collateral_received: u64,
}

#[event]
pub struct AllowEntrySet {
    pub wallet: Pubkey,
    pub roles: u8,
    pub expiry_ts: i64,
}

#[event]
pub struct AllowEntryRemoved {
    pub wallet: Pubkey,
}

#[event]
pub struct GlobalPauseToggled {
    pub paused: bool,
}

#[event]
pub struct SeriesPauseToggled {
    pub series: Pubkey,
    pub paused: bool,
}

#[event]
pub struct AuthorityTransferProposed {
    pub current_authority: Pubkey,
    pub pending_authority: Pubkey,
}

#[event]
pub struct AuthorityTransferAccepted {
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
}
