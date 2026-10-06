use anchor_lang::prelude::*;
use crate::state::{Config, Registry, RENT_VAULT_SEED};
use crate::events::ConfigInitialized;

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = Config::LEN,
        seeds = [Config::SEED],
        bump
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = authority,
        space = Registry::LEN,
        seeds = [Registry::SEED],
        bump
    )]
    pub registry: Box<Account<'info, Registry>>,

    /// CHECK: System-owned PDA that holds lamports for funding FillReceipt rent during on_report
    #[account(
        seeds = [RENT_VAULT_SEED],
        bump
    )]
    pub rent_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_config_handler(
    ctx: Context<InitializeConfig>,
    cluster_mode: u8,
    enclave_key_hash: [u8; 32],
    fee_bps: u16,
    treasury: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.pending_authority = Pubkey::default();
    config.forwarders = Default::default();
    config.forwarder_count = 0;
    config.enclave_key_hash = enclave_key_hash;
    config.paused = false;
    config.cluster_mode = cluster_mode;
    config.fee_bps = fee_bps;
    config.treasury = treasury;
    config.bump = ctx.bumps.config;

    let registry = &mut ctx.accounts.registry;
    registry.count = 0;
    registry.series = Vec::new();
    registry.bump = ctx.bumps.registry;

    emit!(ConfigInitialized {
        authority: config.authority,
        cluster_mode: config.cluster_mode,
    });

    Ok(())
}
