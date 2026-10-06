use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct Registry {
    /// Active series count
    pub count: u16,
    /// Up to 64 active series pubkeys
    pub series: Vec<Pubkey>,
    /// PDA bump seed
    pub bump: u8,
}

impl Registry {
    pub const SEED: &'static [u8] = b"registry";
    // 8 discriminator + 2 count + 4 vec len + (64 * 32) + 1 bump + 32 padding = 2095 bytes
    pub const LEN: usize = 8 + 2 + 4 + (64 * 32) + 1 + 32;

    pub fn append(&mut self, series_key: Pubkey) -> bool {
        if self.series.len() < 64 {
            self.series.push(series_key);
            self.count = self.series.len() as u16;
            true
        } else {
            false
        }
    }
}
