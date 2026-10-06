use anchor_lang::prelude::*;

declare_id!("KALE111111111111111111111111111111111111111");

#[program]
pub mod kalend {
    use super::*;

    pub fn ping(_ctx: Context<Ping>) -> Result<()> {
        msg!("Kalend v0.1.0 initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Ping<'info> {
    pub signer: Signer<'info>,
}
