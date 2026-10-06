use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, mint_to, Mint, TokenAccount, TokenInterface, TransferChecked, MintTo,
};
use crate::errors::KalendError;
use crate::state::{AllowEntry, Config, Series, SeriesStatus, roles};
use crate::events::TokensStripped;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Strip<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        has_one = vault,
        has_one = pt_mint,
        has_one = yt_mint,
        has_one = collateral_mint,
    )]
    pub series: Box<Account<'info, Series>>,

    /// AllowEntry validating the user has the Strip role
    #[account(
        seeds = [AllowEntry::SEED, user.key().as_ref()],
        bump = allow_entry.bump
    )]
    pub allow_entry: Account<'info, AllowEntry>,

    pub collateral_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        mint::token_program = token_2022_program,
    )]
    pub pt_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        mint::token_program = token_2022_program,
    )]
    pub yt_mint: InterfaceAccount<'info, Mint>,

    /// Raw collateral vault owned by Series PDA
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// User's raw collateral source account
    #[account(mut)]
    pub user_collateral: InterfaceAccount<'info, TokenAccount>,

    /// User's PT destination account
    #[account(mut)]
    pub user_pt: InterfaceAccount<'info, TokenAccount>,

    /// User's YT destination account
    #[account(mut)]
    pub user_yt: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub collateral_token_program: Interface<'info, TokenInterface>,
    pub token_2022_program: Interface<'info, TokenInterface>,
}

pub fn strip_handler(ctx: Context<Strip>, amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }
    if ctx.accounts.config.paused {
        return err!(KalendError::ProtocolPaused);
    }

    let series = &ctx.accounts.series;
    if series.status != SeriesStatus::Open as u8 {
        return err!(KalendError::SeriesNotOpen);
    }

    let now = Clock::get()?.unix_timestamp;
    if now >= series.maturity_ts {
        return err!(KalendError::SeriesAlreadyMatured);
    }

    // Role check: must have STRIP role and not expired
    if !ctx.accounts.allow_entry.has_role(roles::STRIP, now) {
        return err!(KalendError::MissingRole);
    }

    // 1. Transfer raw collateral from user to series vault
    transfer_checked(
        CpiContext::new(
            ctx.accounts.collateral_token_program.key(),
            TransferChecked {
                from: ctx.accounts.user_collateral.to_account_info(),
                mint: ctx.accounts.collateral_mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.collateral_mint.decimals,
    )?;

    // 2. Prepare series signer seeds
    let collateral_mint_key = series.collateral_mint;
    let maturity_bytes = series.maturity_ts.to_le_bytes();
    let nonce_bytes = series.nonce.to_le_bytes();
    let signer_seeds: &[&[&[u8]]] = &[&[
        Series::SEED,
        collateral_mint_key.as_ref(),
        maturity_bytes.as_ref(),
        nonce_bytes.as_ref(),
        &[series.bump],
    ]];

    // 3. Mint equal PT to user (Token-2022)
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.key(),
            MintTo {
                mint: ctx.accounts.pt_mint.to_account_info(),
                to: ctx.accounts.user_pt.to_account_info(),
                authority: ctx.accounts.series.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    // 4. Mint equal YT to user (Token-2022)
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_2022_program.key(),
            MintTo {
                mint: ctx.accounts.yt_mint.to_account_info(),
                to: ctx.accounts.user_yt.to_account_info(),
                authority: ctx.accounts.series.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    emit!(TokensStripped {
        series: series.key(),
        user: ctx.accounts.user.key(),
        amount,
    });

    Ok(())
}
