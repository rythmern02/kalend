use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, burn, Mint, TokenAccount, TokenInterface, TransferChecked, Burn,
};
use crate::errors::KalendError;
use crate::state::{AllowEntry, Series, SeriesStatus, roles};
use crate::math::{pt_redeem_raw, yt_claim_raw};
use crate::events::{PtRedeemed, YtClaimed};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RedeemPt<'info> {
    #[account(
        mut,
        has_one = vault,
        has_one = pt_mint,
        has_one = collateral_mint,
    )]
    pub series: Account<'info, Series>,

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

    /// Raw collateral vault owned by Series PDA
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// User's PT token account to burn from
    #[account(mut)]
    pub user_pt: InterfaceAccount<'info, TokenAccount>,

    /// User's raw collateral destination account
    #[account(mut)]
    pub user_collateral: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub collateral_token_program: Interface<'info, TokenInterface>,
    pub token_2022_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct ClaimYt<'info> {
    #[account(
        mut,
        has_one = vault,
        has_one = yt_mint,
        has_one = collateral_mint,
    )]
    pub series: Account<'info, Series>,

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
    pub yt_mint: InterfaceAccount<'info, Mint>,

    /// Raw collateral vault owned by Series PDA
    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// User's YT token account to burn from
    #[account(mut)]
    pub user_yt: InterfaceAccount<'info, TokenAccount>,

    /// User's raw collateral destination account
    #[account(mut)]
    pub user_collateral: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub collateral_token_program: Interface<'info, TokenInterface>,
    pub token_2022_program: Interface<'info, TokenInterface>,
}

pub fn redeem_pt(ctx: Context<RedeemPt>, amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }

    let series = &ctx.accounts.series;
    if series.status != SeriesStatus::Settled as u8 {
        return err!(KalendError::SeriesNotSettled);
    }

    let now = Clock::get()?.unix_timestamp;
    if !ctx.accounts.allow_entry.has_role(roles::REDEEM, now) {
        return err!(KalendError::MissingRole);
    }

    // Principal formula: floor(a * min(idx_open, idx_settle) / idx_settle)
    let raw_payout = pt_redeem_raw(amount, series.idx_open, series.idx_settle)?;

    // 1. Burn user's PT
    burn(
        CpiContext::new(
            ctx.accounts.token_2022_program.key(),
            Burn {
                mint: ctx.accounts.pt_mint.to_account_info(),
                from: ctx.accounts.user_pt.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. Transfer raw collateral payout to user
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

    if raw_payout > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.collateral_token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.collateral_mint.to_account_info(),
                    to: ctx.accounts.user_collateral.to_account_info(),
                    authority: ctx.accounts.series.to_account_info(),
                },
                signer_seeds,
            ),
            raw_payout,
            ctx.accounts.collateral_mint.decimals,
        )?;
    }

    emit!(PtRedeemed {
        series: series.key(),
        user: ctx.accounts.user.key(),
        pt_amount: amount,
        raw_collateral_received: raw_payout,
    });

    Ok(())
}

pub fn claim_yt(ctx: Context<ClaimYt>, amount: u64) -> Result<()> {
    if amount == 0 {
        return err!(KalendError::ZeroAmount);
    }

    let series = &ctx.accounts.series;
    if series.status != SeriesStatus::Settled as u8 {
        return err!(KalendError::SeriesNotSettled);
    }

    let now = Clock::get()?.unix_timestamp;
    if !ctx.accounts.allow_entry.has_role(roles::CLAIM, now) {
        return err!(KalendError::MissingRole);
    }

    // Growth formula: floor(a * (idx_settle - min(idx_open, idx_settle)) / idx_settle)
    let raw_payout = yt_claim_raw(amount, series.idx_open, series.idx_settle)?;

    // 1. Burn user's YT
    burn(
        CpiContext::new(
            ctx.accounts.token_2022_program.key(),
            Burn {
                mint: ctx.accounts.yt_mint.to_account_info(),
                from: ctx.accounts.user_yt.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount,
    )?;

    // 2. Transfer raw collateral payout to user if yield accrued
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

    if raw_payout > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.collateral_token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.collateral_mint.to_account_info(),
                    to: ctx.accounts.user_collateral.to_account_info(),
                    authority: ctx.accounts.series.to_account_info(),
                },
                signer_seeds,
            ),
            raw_payout,
            ctx.accounts.collateral_mint.decimals,
        )?;
    }

    emit!(YtClaimed {
        series: series.key(),
        user: ctx.accounts.user.key(),
        yt_amount: amount,
        raw_collateral_received: raw_payout,
    });

    Ok(())
}
