use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Escrow {
    /// Owner wallet that deposited the escrowed tokens
    pub owner: Pubkey,
    /// Associated series PDA
    pub series: Pubkey,
    /// Token mint held in escrow (PT, YT, or quote token)
    pub mint: Pubkey,
    /// Unix timestamp before which the owner cannot withdraw
    pub lock_until: i64,
    /// Current quantity of tokens locked in escrow
    pub amount: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl Escrow {
    pub const SEED: &'static [u8] = b"escrow";
    // 8 discriminator + 32 + 32 + 32 + 8 + 8 + 1 + 16 padding = 137 bytes
    pub const LEN: usize = 8 + 32 + 32 + 32 + 8 + 8 + 1 + 16;
}
