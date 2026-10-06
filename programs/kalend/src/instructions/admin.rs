use anchor_lang::prelude::*;
use crate::errors::KalendError;
use crate::state::{Config, ForwarderEntry, Series};
use crate::events::{
    ForwarderUpdated, GlobalPauseToggled, SeriesPauseToggled,
    AuthorityTransferProposed, AuthorityTransferAccepted,
};

pub const MOCK_FORWARDER_PROGRAM_DEVNET: Pubkey =
    pubkey!("7kuEAA3mSC1Tz8gQjnvH7bKFda9xSPRRin9SZbH49cNK");

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(
        mut,
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ KalendError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AcceptAuthority<'info> {
    #[account(
        mut,
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    pub pending_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct PauseSeries<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
        has_one = authority @ KalendError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(mut)]
    pub series: Account<'info, Series>,

    pub authority: Signer<'info>,
}

pub fn set_forwarder_entry(
    ctx: Context<AdminAction>,
    index: u8,
    program: Pubkey,
    state: Pubkey,
    allowed_workflow: [u8; 32],
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    // Strict security check: reject mock forwarder on mainnet
    if config.cluster_mode == 2 && program == MOCK_FORWARDER_PROGRAM_DEVNET {
        return err!(KalendError::MockForwarderForbidden);
    }

    if (index as usize) >= config.forwarders.len() {
        return err!(KalendError::Unauthorized);
    }

    config.forwarders[index as usize] = ForwarderEntry {
        program,
        state,
        allowed_workflow,
    };

    if (index + 1) > config.forwarder_count {
        config.forwarder_count = index + 1;
    }

    emit!(ForwarderUpdated {
        index,
        program,
        state,
        allowed_workflow,
    });

    Ok(())
}

pub fn propose_authority(ctx: Context<AdminAction>, new_authority: Pubkey) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.pending_authority = new_authority;

    emit!(AuthorityTransferProposed {
        current_authority: config.authority,
        pending_authority: new_authority,
    });

    Ok(())
}

pub fn accept_authority(ctx: Context<AcceptAuthority>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    if ctx.accounts.pending_authority.key() != config.pending_authority {
        return err!(KalendError::PendingAuthorityMismatch);
    }

    let old_auth = config.authority;
    config.authority = config.pending_authority;
    config.pending_authority = Pubkey::default();

    emit!(AuthorityTransferAccepted {
        old_authority: old_auth,
        new_authority: config.authority,
    });

    Ok(())
}

pub fn pause_global(ctx: Context<AdminAction>, paused: bool) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.paused = paused;

    emit!(GlobalPauseToggled { paused });
    Ok(())
}

pub fn pause_series(ctx: Context<PauseSeries>, paused: bool) -> Result<()> {
    let series = &mut ctx.accounts.series;
    if paused {
        series.status = crate::state::SeriesStatus::Paused as u8;
    } else {
        series.status = crate::state::SeriesStatus::Open as u8;
    }

    emit!(SeriesPauseToggled {
        series: series.key(),
        paused,
    });
    Ok(())
}
