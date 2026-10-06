use anchor_lang::prelude::*;

pub mod roles {
    pub const STRIP: u8 = 1 << 0;     // 1
    pub const REDEEM: u8 = 1 << 1;    // 2
    pub const CLAIM: u8 = 1 << 2;     // 4
    pub const REQUESTER: u8 = 1 << 3; // 8
    pub const DEALER: u8 = 1 << 4;    // 16
}

#[account]
#[derive(Default, Debug)]
pub struct AllowEntry {
    /// Whitelisted wallet address
    pub wallet: Pubkey,
    /// Unix timestamp when this allow entry expires
    pub expiry_ts: i64,
    /// Bitmask of permitted actions (see roles module)
    pub roles: u8,
    /// PDA bump seed
    pub bump: u8,
}

impl AllowEntry {
    pub const SEED: &'static [u8] = b"allow";
    // 8 discriminator + 32 wallet + 8 expiry + 1 roles + 1 bump + 16 padding = 66 bytes
    pub const LEN: usize = 8 + 32 + 8 + 1 + 1 + 16;

    pub fn has_role(&self, role_bit: u8, now: i64) -> bool {
        if now > self.expiry_ts {
            return false;
        }
        (self.roles & role_bit) != 0
    }
}
