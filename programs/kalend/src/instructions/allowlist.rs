use anchor_lang::prelude::*;
use crate::errors::KalendError;
use crate::state::{AllowEntry, Config};
use crate::events::{AllowEntrySet, AllowEntryRemoved};

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct SetAllowEntry<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ KalendError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = authority,
        space = AllowEntry::LEN,
        seeds = [AllowEntry::SEED, wallet.as_ref()],
        bump
    )]
    pub allow_entry: Account<'info, AllowEntry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct RemoveAllowEntry<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ KalendError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        close = authority,
        seeds = [AllowEntry::SEED, wallet.as_ref()],
        bump = allow_entry.bump
    )]
    pub allow_entry: Account<'info, AllowEntry>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn set_allow_entry(
    ctx: Context<SetAllowEntry>,
    wallet: Pubkey,
    roles: u8,
    expiry_ts: i64,
) -> Result<()> {
    let entry = &mut ctx.accounts.allow_entry;
    entry.wallet = wallet;
    entry.roles = roles;
    entry.expiry_ts = expiry_ts;
    entry.bump = ctx.bumps.allow_entry;

    emit!(AllowEntrySet {
        wallet,
        roles,
        expiry_ts,
    });
    Ok(())
}

pub fn remove_allow_entry(_ctx: Context<RemoveAllowEntry>, wallet: Pubkey) -> Result<()> {
    emit!(AllowEntryRemoved { wallet });
    Ok(())
}
