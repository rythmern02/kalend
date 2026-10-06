use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(use_discriminant = true)]
pub enum Side {
    SellPT = 0,
    SellYT = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[borsh(use_discriminant = true)]
pub enum FillStatus {
    Approved = 0,
    Executed = 1,
}

#[account]
#[derive(Default, Debug)]
pub struct FillReceipt {
    /// Unique round ID (32 bytes), acts as the global replay guard
    pub round_id: [u8; 32],
    /// Series PDA traded in this fill
    pub series: Pubkey,
    /// Requester wallet address
    pub requester: Pubkey,
    /// Winning dealer wallet address
    pub dealer: Pubkey,
    /// 0 = SellPT, 1 = SellYT
    pub side: u8,
    /// Quantity of asset tokens (PT or YT) filled
    pub asset_amount: u64,
    /// Quantity of quote tokens paid
    pub quote_amount: u64,
    /// Quote currency mint
    pub quote_mint: Pubkey,
    /// Unix timestamp of receipt creation
    pub ts: i64,
    /// Hash of the signed forwarder report
    pub report_hash: [u8; 32],
    /// Fill lifecycle status: 0 = Approved, 1 = Executed
    pub status: u8,
    /// PDA bump seed
    pub bump: u8,
}

impl FillReceipt {
    pub const SEED: &'static [u8] = b"fill";
    // 8 + 32 + 32 + 32 + 32 + 1 + 8 + 8 + 32 + 8 + 32 + 1 + 1 + 32 (padding) = 267 bytes
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 1 + 8 + 8 + 32 + 8 + 32 + 1 + 1 + 32;
}
